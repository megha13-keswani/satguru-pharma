const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { notifyExpiryAlert } = require('../services/notification.service');

/** Every day at 8:30 AM: flag medicines expiring within the next 60 days. */
function startExpiryAlertJob() {
  cron.schedule('30 8 * * *', async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 60);

      const expiringSoon = await prisma.medicine.findMany({
        where: { active: true, expiryDate: { lte: cutoff, gte: new Date() } },
      });
      if (expiringSoon.length === 0) return;

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      await Promise.all(expiringSoon.map((m) => notifyExpiryAlert(m, admins)));

      console.log(`Expiry alert job: flagged ${expiringSoon.length} item(s) expiring within 60 days.`);
    } catch (err) {
      console.error('Expiry alert job failed:', err.message);
    }
  });
}

module.exports = { startExpiryAlertJob };