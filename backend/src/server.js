require('dotenv').config();
const app = require('./app');
const { startLowStockJob } = require('./jobs/lowStock.job');
const { startExpiryAlertJob } = require('./jobs/expiryAlert.job');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Satguru Pharma API running on port ${PORT}`);

  // Scheduled jobs
  startLowStockJob();     // daily low-stock email summary + push alerts
  startExpiryAlertJob();  // daily expiry alert scan
});