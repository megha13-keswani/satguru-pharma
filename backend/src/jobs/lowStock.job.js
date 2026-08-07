const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { sendEmail } = require('../services/notification.service');

/** Every morning at 8 AM: email admins a summary of all low-stock medicines. */
function startLowStockJob() {
  cron.schedule('0 8 * * *', async () => {
    try {
      const lowStockItems = await prisma.medicine.findMany({
        where: { active: true, stockStatus: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
        orderBy: { stockStrips: 'asc' },
      });
      if (lowStockItems.length === 0) return;

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      const rows = lowStockItems
        .map((m) => `<tr><td>${m.name}</td><td>${m.brand}</td><td>${m.stockStrips} strips</td><td>${m.stockStatus}</td></tr>`)
        .join('');

      const html = `
        <h3>Daily Low Stock Summary — ${new Date().toLocaleDateString('en-IN')}</h3>
        <table border="1" cellpadding="6" style="border-collapse:collapse">
          <tr><th>Medicine</th><th>Brand</th><th>Stock</th><th>Status</th></tr>
          ${rows}
        </table>
      `;

      await Promise.all(admins.map((admin) => sendEmail({
        to: admin.email,
        subject: `Low Stock Summary — ${lowStockItems.length} items need attention`,
        html,
      })));

      console.log(`Low stock job: emailed ${admins.length} admin(s) about ${lowStockItems.length} items.`);
    } catch (err) {
      console.error('Low stock job failed:', err.message);
    }
  });
}

module.exports = { startLowStockJob };