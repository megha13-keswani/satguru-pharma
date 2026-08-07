/**
 * MARG ERP Integration Adapter
 * Bidirectional bridge: stock/pricing pulled FROM Marg, orders pushed TO Marg as vouchers.
 * Safe to leave MARG_API_KEY empty in .env for now — calls will fail gracefully
 * and get logged in MargSyncLog without blocking order placement.
 */
const xml2js = require('xml2js');
const prisma = require('../lib/prisma');

const BASE_URL = process.env.MARG_API_BASE_URL;
const API_KEY = process.env.MARG_API_KEY;
const CLIENT_ID = process.env.MARG_CLIENT_ID;
const FORMAT = process.env.MARG_FORMAT || 'JSON';

function client() {
  const axios = require('axios');
  return axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
      'X-Api-Key': API_KEY,
      'X-Client-Id': CLIENT_ID,
      'Content-Type': FORMAT === 'XML' ? 'application/xml' : 'application/json',
    },
  });
}

function toStockStatus(stockStrips, threshold) {
  if (stockStrips <= 0) return 'OUT_OF_STOCK';
  if (stockStrips < threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

/** Pulls full item master + live stock from MARG, upserts local Medicine rows. */
async function pullFullInventorySync(triggeredBy = 'manual') {
  let itemsSynced = 0;
  try {
    const res = await client().get('/items/stock');
    const items = FORMAT === 'XML' ? await parseXml(res.data) : res.data.items;

    for (const raw of items) {
      const item = normalizeMargItem(raw);
      const existing = await prisma.medicine.findFirst({ where: { marginItemCode: item.marginItemCode } });

      if (existing) {
        const status = toStockStatus(item.stockStrips, existing.lowStockThreshold);
        await prisma.medicine.update({
          where: { id: existing.id },
          data: {
            stockStrips: item.stockStrips,
            mrp: item.mrp,
            wholesalePrice: item.wholesalePrice,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            hsnCode: item.hsnCode,
            gstPercent: item.gstPercent,
            stockStatus: status,
            source: 'MARG',
          },
        });
        await prisma.stockLog.create({
          data: {
            medicineId: existing.id,
            change: item.stockStrips - existing.stockStrips,
            reason: 'MARG_SYNC',
            resultingStock: item.stockStrips,
          },
        });
      }
      itemsSynced += 1;
    }

    await prisma.margSyncLog.create({
      data: { source: 'MARG', direction: 'INBOUND', status: 'SUCCESS', itemsSynced, triggeredBy },
    });
    return { success: true, itemsSynced };
  } catch (err) {
    await prisma.margSyncLog.create({
      data: {
        source: 'MARG', direction: 'INBOUND', status: 'FAILED',
        itemsSynced, errorDetail: err.message, triggeredBy,
      },
    });
    throw err;
  }
}

/** Handles MARG's stock-change webhook for near-real-time updates. */
async function handleInboundWebhook(payload) {
  const item = normalizeMargItem(payload);
  const existing = await prisma.medicine.findFirst({ where: { marginItemCode: item.marginItemCode } });
  if (!existing) {
    await prisma.margSyncLog.create({
      data: {
        source: 'MARG', direction: 'INBOUND', status: 'PARTIAL', itemsSynced: 0,
        errorDetail: `Webhook item ${item.marginItemCode} not mapped to a local medicine`,
        triggeredBy: 'webhook',
      },
    });
    return { matched: false };
  }

  const status = toStockStatus(item.stockStrips, existing.lowStockThreshold);
  await prisma.$transaction([
    prisma.medicine.update({
      where: { id: existing.id },
      data: {
        stockStrips: item.stockStrips,
        mrp: item.mrp,
        wholesalePrice: item.wholesalePrice,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        stockStatus: status,
      },
    }),
    prisma.stockLog.create({
      data: {
        medicineId: existing.id,
        change: item.stockStrips - existing.stockStrips,
        reason: 'MARG_SYNC',
        resultingStock: item.stockStrips,
      },
    }),
    prisma.margSyncLog.create({
      data: { source: 'MARG', direction: 'INBOUND', status: 'SUCCESS', itemsSynced: 1, triggeredBy: 'webhook' },
    }),
  ]);

  return { matched: true, medicineId: existing.id, status };
}

/** Pushes a confirmed order to MARG as a sale voucher; returns MARG's voucher id (or null on failure). */
async function pushOrderAsVoucher(order) {
  if (!BASE_URL || !API_KEY) {
    console.warn('MARG not configured yet — skipping voucher push.');
    return null;
  }

  const payload = {
    voucherType: 'SALE',
    clientId: CLIENT_ID,
    customerGst: order.shop.gstNumber,
    customerCode: order.shop.marginCode || undefined,
    invoiceNumber: order.orderNumber,
    date: order.createdAt,
    items: order.items.map((i) => ({
      itemCode: i.medicine.marginItemCode,
      itemName: i.medicineName,
      batchNumber: i.batchNumber,
      expiry: i.expiryDate,
      qtyStrips: i.quantityStrips,
      rate: i.rate,
      gstPercent: i.gstPercent,
      hsn: i.hsnCode,
    })),
    grandTotal: order.grandTotal,
  };

  try {
    const res = await client().post('/vouchers/sale', FORMAT === 'XML' ? buildXml(payload) : payload);
    const voucherId = FORMAT === 'XML' ? (await parseXml(res.data)).voucherId : res.data.voucherId;

    await prisma.margSyncLog.create({
      data: { source: 'MARG', direction: 'OUTBOUND', status: 'SUCCESS', itemsSynced: order.items.length, triggeredBy: 'order_placed' },
    });
    return voucherId;
  } catch (err) {
    await prisma.margSyncLog.create({
      data: {
        source: 'MARG', direction: 'OUTBOUND', status: 'FAILED',
        itemsSynced: 0, errorDetail: err.message, triggeredBy: 'order_placed',
      },
    });
    return null;
  }
}

/** Pushes a newly-approved shop as a customer record into MARG. */
async function pushCustomerRecord(shop) {
  if (!BASE_URL || !API_KEY) {
    console.warn('MARG not configured yet — skipping customer push.');
    return null;
  }
  try {
    const payload = {
      name: shop.shopName,
      gst: shop.gstNumber,
      drugLicense: shop.drugLicenseNumber,
      phone: shop.phone,
      address: shop.address,
    };
    const res = await client().post('/customers', FORMAT === 'XML' ? buildXml(payload) : payload);
    const customerCode = FORMAT === 'XML' ? (await parseXml(res.data)).customerCode : res.data.customerCode;
    if (customerCode) {
      await prisma.shop.update({ where: { id: shop.id }, data: { marginCode: customerCode } });
    }
    return customerCode;
  } catch (err) {
    await prisma.margSyncLog.create({
      data: { source: 'MARG', direction: 'OUTBOUND', status: 'FAILED', itemsSynced: 0, errorDetail: err.message, triggeredBy: 'shop_approved' },
    });
    return null;
  }
}

function normalizeMargItem(raw) {
  return {
    marginItemCode: raw.itemCode || raw.item_code,
    stockStrips: Number(raw.stockQty ?? raw.stock_qty ?? 0),
    mrp: Number(raw.mrp ?? 0),
    wholesalePrice: Number(raw.saleRate ?? raw.sale_rate ?? 0),
    batchNumber: raw.batchNumber || raw.batch_number || null,
    expiryDate: raw.expiry ? new Date(raw.expiry) : null,
    hsnCode: raw.hsn || raw.hsn_code || '',
    gstPercent: Number(raw.gstPercent ?? raw.gst_percent ?? 12),
  };
}

function buildXml(obj) {
  const builder = new xml2js.Builder({ rootName: 'MargRequest' });
  return builder.buildObject(obj);
}

async function parseXml(xml) {
  return xml2js.parseStringPromise(xml, { explicitArray: false });
}

module.exports = {
  pullFullInventorySync,
  handleInboundWebhook,
  pushOrderAsVoucher,
  pushCustomerRecord,
};