const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { syncCatalog } = require('../integrations/intas.adapter');

const router = express.Router();

// Admin: manual "Sync Now" button for Intas catalog
router.post('/sync', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await syncCatalog('manual');
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const logs = await prisma.margSyncLog.findMany({
      where: { source: 'INTAS' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const lastSuccess = await prisma.margSyncLog.findFirst({
      where: { source: 'INTAS', status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ lastSyncedAt: lastSuccess?.createdAt || null, logs });
  } catch (err) { next(err); }
});

module.exports = router;