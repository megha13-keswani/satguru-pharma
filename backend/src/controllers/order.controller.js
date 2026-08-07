const { v4: uuid } = require('uuid');
const prisma = require('../lib/prisma');
const { getOrCreateActiveCart, withTotals } = require('./cart.controller');
const { generateAndSendInvoice } = require('../services/invoice.service');
const { pushOrderAsVoucher } = require('../integrations/marg.adapter');
const { placeDistributorOrder } = require('../integrations/intas.adapter');
const { sendOrderConfirmation } = require('../services/whatsapp.service');
const { notifyOrderStatus } = require('../services/notification.service');

function computeStockStatus(stockStrips, threshold) {
  if (stockStrips <= 0) return 'OUT_OF_STOCK';
  if (stockStrips < threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

exports.placeOrder = async (req, res, next) => {
  try {
    const shop = req.user.shop;
    const { addressId, paymentTerm, notes, prescriptionUrl } = req.body;

    const cart = await getOrCreateActiveCart(shop.id);
    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { medicine: true } } },
    });

    if (!fullCart.items.length) return res.status(400).json({ error: 'Cart is empty' });

    // Validate stock availability before committing
    for (const item of fullCart.items) {
      if (item.medicine.stockStrips < item.quantityStrips) {
        return res.status(409).json({
          error: `${item.medicine.name} only has ${item.medicine.stockStrips} strips available (requested ${item.quantityStrips}).`,
        });
      }
      if (item.medicine.prescriptionRequired && !prescriptionUrl) {
        return res.status(400).json({
          error: `${item.medicine.name} requires a prescription upload before ordering.`,
        });
      }
    }

    const { subtotal, gstTotal, grandTotal } = withTotals(fullCart);
    const orderNumber = `SGP-${Date.now()}-${uuid().slice(0, 6).toUpperCase()}`;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          shopId: shop.id,
          addressId: addressId || null,
          paymentTerm: paymentTerm || shop.paymentTerm,
          notes,
          subtotal,
          gstTotal,
          grandTotal,
          items: {
            create: fullCart.items.map((item) => ({
              medicineId: item.medicineId,
              medicineName: item.medicine.name,
              batchNumber: item.medicine.batchNumber,
              expiryDate: item.medicine.expiryDate,
              hsnCode: item.medicine.hsnCode,
              quantityStrips: item.quantityStrips,
              mrp: item.medicine.mrp,
              rate: item.medicine.wholesalePrice,
              gstPercent: item.medicine.gstPercent,
              gstAmount: (item.medicine.wholesalePrice * item.quantityStrips * item.medicine.gstPercent) / 100,
              total: item.medicine.wholesalePrice * item.quantityStrips
                + (item.medicine.wholesalePrice * item.quantityStrips * item.medicine.gstPercent) / 100,
            })),
          },
          tracking: { create: { status: 'PLACED' } },
        },
        include: { items: true, shop: true },
      });

      // Real-time stock deduction
      for (const item of fullCart.items) {
        const newStock = item.medicine.stockStrips - item.quantityStrips;
        const status = computeStockStatus(newStock, item.medicine.lowStockThreshold);
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: { stockStrips: newStock, stockStatus: status },
        });
        await tx.stockLog.create({
          data: { medicineId: item.medicineId, change: -item.quantityStrips, reason: 'ORDER', resultingStock: newStock },
        });
      }

      if (prescriptionUrl) {
        await tx.prescription.create({
          data: { shopId: shop.id, fileUrl: prescriptionUrl, orderId: created.id },
        });
      }

      // Clear the cart (mark as no longer the active draft)
      await tx.cart.update({ where: { id: cart.id }, data: { isDraft: false } });

      return created;
    });

    // Post-commit integrations — best-effort, don't block order success on failure
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: { shop: true, items: { include: { medicine: true } } },
    });

    pushOrderAsVoucher(orderWithItems)
      .then((voucherId) => voucherId && prisma.order.update({ where: { id: order.id }, data: { margVoucherId: voucherId } }))
      .catch((e) => console.error('MARG voucher push failed:', e.message));

    placeDistributorOrder(orderWithItems).catch((e) => console.error('Intas order push failed:', e.message));

    generateAndSendInvoice(order.id, req.user.email).catch((e) => console.error('Invoice generation failed:', e.message));

    sendOrderConfirmation(orderWithItems, shop.phone)
      .then((r) => r.sent && prisma.order.update({ where: { id: order.id }, data: { whatsappSent: true } }))
      .catch((e) => console.error('WhatsApp confirmation failed:', e.message));

    res.status(201).json({ order: orderWithItems });
  } catch (err) { next(err); }
};

exports.listMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { shopId: req.user.shop.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true, invoice: true },
    });
    res.json({ orders });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, invoice: true, shop: true, tracking: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isOwner = req.user.shop && order.shopId === req.user.shop.id;
    if (!isOwner && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    res.json({ order });
  } catch (err) { next(err); }
};

exports.trackOrder = async (req, res, next) => {
  try {
    const tracking = await prisma.orderTracking.findMany({
      where: { orderId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ tracking });
  } catch (err) { next(err); }
};

exports.adminListAll = async (req, res, next) => {
  try {
    const { status, shopId, from, to, page = 1, pageSize = 30 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (shopId) where.shopId = shopId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    const skip = (Number(page) - 1) * Number(pageSize);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: { shop: true, items: true },
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const valid = ['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, tracking: { create: { status, note } } },
      include: { shop: { include: { user: true } } },
    });

    notifyOrderStatus(order, order.shop.user.email).catch((e) => console.error('Status email failed:', e.message));

    res.json({ order });
  } catch (err) { next(err); }
};