const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { pullFullInventorySync, handleInboundWebhook } = require('../integrations/marg.adapter');

const router = express.Router();

// MARG calls this whenever stock changes on their end (no login — secured by webhook secret instead)
router.post('/webhook', async (req, res, next) => {
  try {
    const secret = req.headers['x-marg-webhook-secret'];
    if (secret !== process.env.MARG_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }
    const result = await handleInboundWebhook(req.body);
    res.json(result);
  } catch (err) { next(err); }
});

// Admin: manual "Sync Now" button
router.post('/sync', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await pullFullInventorySync('manual');
    res.json(result);
  } catch (err) { next(err); }
});

// Admin: sync status panel — last synced timestamp + recent error logs
router.get('/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const logs = await prisma.margSyncLog.findMany({
      where: { source: 'MARG' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const lastSuccess = await prisma.margSyncLog.findFirst({
      where: { source: 'MARG', status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ lastSyncedAt: lastSuccess?.createdAt || null, logs });
  } catch (err) { next(err); }
});

module.exports = router;