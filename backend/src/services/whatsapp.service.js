const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function sendOrderConfirmation(order, toPhone) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.warn('WhatsApp not configured — skipping order confirmation message.');
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const axios = require('axios');
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toPhone.replace(/[^0-9]/g, ''),
        type: 'template',
        template: {
          name: 'order_confirmation',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: order.orderNumber },
                { type: 'text', text: `₹${order.grandTotal.toFixed(2)}` },
                { type: 'text', text: String(order.items.length) },
              ],
            },
          ],
        },
      },
      { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
    );
    return { sent: true };
  } catch (err) {
    console.error('WhatsApp send failed:', err.response?.data || err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendOrderConfirmation };