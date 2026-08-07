const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Wholesaler: get their own shop's chat thread
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    if (!req.user.shop) return res.status(403).json({ error: 'No shop found' });
    const messages = await prisma.message.findMany({
      where: { shopId: req.user.shop.id },
      orderBy: { createdAt: 'asc' },
    });
    await prisma.message.updateMany({
      where: { shopId: req.user.shop.id, senderRole: 'ADMIN', read: false },
      data: { read: true },
    });
    res.json({ messages });
  } catch (err) { next(err); }
});

// Wholesaler: send a message to admin
router.post('/mine', requireAuth, async (req, res, next) => {
  try {
    if (!req.user.shop) return res.status(403).json({ error: 'No shop found' });
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
    const message = await prisma.message.create({
      data: { shopId: req.user.shop.id, senderRole: 'WHOLESALER', body: body.trim() },
    });
    res.status(201).json({ message });
  } catch (err) { next(err); }
});

// Admin: list all shops with last message preview + unread count (inbox)
router.get('/admin/inbox', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: { where: { senderRole: 'WHOLESALER', read: false } } } },
      },
      orderBy: { shopName: 'asc' },
    });
    res.json({ shops });
  } catch (err) { next(err); }
});

// Admin: get messages for a specific shop
router.get('/admin/:shopId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { shopId: req.params.shopId },
      orderBy: { createdAt: 'asc' },
    });
    await prisma.message.updateMany({
      where: { shopId: req.params.shopId, senderRole: 'WHOLESALER', read: false },
      data: { read: true },
    });
    res.json({ messages });
  } catch (err) { next(err); }
});

// Admin: send a message to a specific shop
router.post('/admin/:shopId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });
    const message = await prisma.message.create({
      data: { shopId: req.params.shopId, senderRole: 'ADMIN', body: body.trim() },
    });
    res.status(201).json({ message });
  } catch (err) { next(err); }
});

module.exports = router;