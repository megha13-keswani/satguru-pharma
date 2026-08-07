/**
 * Intas Distributor Integration Adapter
 * Same pattern as MARG — pulls catalog/pricing, pushes distributor orders.
 * Safe with empty .env values — just skips with a console warning.
 */
const prisma = require('../lib/prisma');

const BASE_URL = process.env.INTAS_API_BASE_URL;
const API_KEY = process.env.INTAS_API_KEY;
const DISTRIBUTOR_ID = process.env.INTAS_DISTRIBUTOR_ID;

function client() {
  const axios = require('axios');
  return axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { Authorization: `Bearer ${API_KEY}`, 'X-Distributor-Id': DISTRIBUTOR_ID },
  });
}

/** Pulls Intas's product catalog with pricing + availability, upserts into Medicine. */
async function syncCatalog(triggeredBy = 'manual') {
  if (!BASE_URL || !API_KEY) {
    console.warn('Intas not configured yet — skipping catalog sync.');
    return { success: false, itemsSynced: 0 };
  }

  let itemsSynced = 0;
  try {
    const res = await client().get('/catalog/products');
    const products = res.data.products || [];

    for (const p of products) {
      const existing = await prisma.medicine.findFirst({ where: { intasProductCode: p.productCode } });
      const stockStrips = Number(p.availableStrips ?? 0);

      if (existing) {
        await prisma.medicine.update({
          where: { id: existing.id },
          data: {
            stockStrips,
            wholesalePrice: Number(p.distributorPrice ?? existing.wholesalePrice),
            mrp: Number(p.mrp ?? existing.mrp),
            stockStatus: stockStrips <= 0 ? 'OUT_OF_STOCK'
              : stockStrips < existing.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
            source: 'INTAS',
          },
        });
        await prisma.stockLog.create({
          data: {
            medicineId: existing.id,
            change: stockStrips - existing.stockStrips,
            reason: 'INTAS_SYNC',
            resultingStock: stockStrips,
          },
        });
      }
      itemsSynced += 1;
    }

    await prisma.margSyncLog.create({
      data: { source: 'INTAS', direction: 'INBOUND', status: 'SUCCESS', itemsSynced, triggeredBy },
    });
    return { success: true, itemsSynced };
  } catch (err) {
    await prisma.margSyncLog.create({
      data: { source: 'INTAS', direction: 'INBOUND', status: 'FAILED', itemsSynced, errorDetail: err.message, triggeredBy },
    });
    throw err;
  }
}

/** Places a distributor order with Intas for items sourced from them. */
async function placeDistributorOrder(order) {
  if (!BASE_URL || !API_KEY) {
    console.warn('Intas not configured yet — skipping distributor order push.');
    return null;
  }

  const intasItems = order.items.filter((i) => i.medicine.source === 'INTAS');
  if (intasItems.length === 0) return null;

  try {
    const res = await client().post('/orders', {
      distributorId: DISTRIBUTOR_ID,
      referenceOrderNumber: order.orderNumber,
      items: intasItems.map((i) => ({
        productCode: i.medicine.intasProductCode,
        qtyStrips: i.quantityStrips,
      })),
    });
    await prisma.margSyncLog.create({
      data: { source: 'INTAS', direction: 'OUTBOUND', status: 'SUCCESS', itemsSynced: intasItems.length, triggeredBy: 'order_placed' },
    });
    return res.data.intasOrderId;
  } catch (err) {
    await prisma.margSyncLog.create({
      data: { source: 'INTAS', direction: 'OUTBOUND', status: 'FAILED', itemsSynced: 0, errorDetail: err.message, triggeredBy: 'order_placed' },
    });
    return null;
  }
}

module.exports = { syncCatalog, placeDistributorOrder };