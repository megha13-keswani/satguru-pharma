const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// Revenue + order count grouped by day, last N days
router.get('/revenue', async (req, res, next) => {
  try {
    const days = Number(req.query.days || 30);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      select: { createdAt: true, grandTotal: true },
    });

    const byDay = {};
    orders.forEach((o) => {
      const key = o.createdAt.toISOString().slice(0, 10);
      byDay[key] = (byDay[key] || 0) + o.grandTotal;
    });

    res.json({ revenueByDay: byDay });
  } catch (err) { next(err); }
});

// Top-selling medicines
router.get('/top-medicines', async (req, res, next) => {
  try {
    const top = await prisma.orderItem.groupBy({
      by: ['medicineId', 'medicineName'],
      _sum: { quantityStrips: true, total: true },
      orderBy: { _sum: { quantityStrips: 'desc' } },
      take: 10,
    });
    res.json({ topMedicines: top });
  } catch (err) { next(err); }
});

// Top shops by order value
router.get('/top-shops', async (req, res, next) => {
  try {
    const top = await prisma.order.groupBy({
      by: ['shopId'],
      _sum: { grandTotal: true },
      _count: { id: true },
      orderBy: { _sum: { grandTotal: 'desc' } },
      take: 10,
    });
    const shops = await prisma.shop.findMany({ where: { id: { in: top.map((t) => t.shopId) } } });
    const merged = top.map((t) => ({
      shop: shops.find((s) => s.id === t.shopId),
      totalRevenue: t._sum.grandTotal,
      orderCount: t._count.id,
    }));
    res.json({ topShops: merged });
  } catch (err) { next(err); }
});

module.exports = router;