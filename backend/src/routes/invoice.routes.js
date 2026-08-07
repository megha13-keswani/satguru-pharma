const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { generateAndSendInvoice } = require('../services/invoice.service');

const router = express.Router();

// Download / view an invoice
router.get('/:orderId', requireAuth, async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { orderId: req.params.orderId }, include: { order: true } });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const isOwner = req.user.shop && invoice.order.shopId === req.user.shop.id;
    if (!isOwner && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

    res.json({ invoice });
  } catch (err) { next(err); }
});

// Admin: resend an invoice email
router.post('/:orderId/resend', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { shop: { include: { user: true } } } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const invoice = await generateAndSendInvoice(order.id, order.shop.user.email);
    res.json({ message: 'Invoice resent', invoice });
  } catch (err) { next(err); }
});

module.exports = router;