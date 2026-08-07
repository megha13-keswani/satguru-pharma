const nodemailer = require('nodemailer');
const prisma = require('../lib/prisma');

let firebaseAdmin = null;
function getFirebase() {
  if (firebaseAdmin) return firebaseAdmin;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      });
    }
    firebaseAdmin = admin;
    return admin;
  } catch (err) {
    console.warn('Firebase not configured, push notifications disabled:', err.message);
    return null;
  }
}

function mailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendEmail({ to, subject, html, attachments }) {
  try {
    await mailer().sendMail({ from: process.env.EMAIL_FROM, to, subject, html, attachments });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

async function sendPush({ token, title, body, data = {} }) {
  const admin = getFirebase();
  if (!admin || !token) return;
  try {
    await admin.messaging().send({ token, notification: { title, body }, data });
  } catch (err) {
    console.error('Push send failed:', err.message);
  }
}

async function logNotification(userId, title, body, type) {
  return prisma.notification.create({ data: { userId, title, body, type } });
}

async function notifyAdminsNewSignup(user) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
  await Promise.all(admins.map((admin) => Promise.all([
    logNotification(admin.id, 'New shop registration', `${user.name} submitted a signup request.`, 'APPROVAL'),
    sendEmail({
      to: admin.email,
      subject: 'New Satguru Pharma shop registration pending approval',
      html: `<p>A new wholesaler signup is pending review: <b>${user.name}</b> (${user.email}).</p>`,
    }),
  ])));
}

async function notifyLowStock(medicine, admins) {
  await Promise.all(admins.map((admin) => Promise.all([
    logNotification(
      admin.id,
      'Low stock alert',
      `${medicine.name} is running low — only ${medicine.stockStrips} strips remaining.`,
      'LOW_STOCK'
    ),
  ])));
}

async function notifyExpiryAlert(medicine, admins) {
  await Promise.all(admins.map((admin) => logNotification(
    admin.id,
    'Expiry alert',
    `${medicine.name} (batch ${medicine.batchNumber || 'N/A'}) expires on ${medicine.expiryDate?.toDateString()}.`,
    'EXPIRY_ALERT'
  )));
}

async function notifyOrderStatus(order, shopUserEmail) {
  await sendEmail({
    to: shopUserEmail,
    subject: `Order ${order.orderNumber} — status: ${order.status}`,
    html: `<p>Your order <b>${order.orderNumber}</b> is now <b>${order.status}</b>.</p>`,
  });
}

module.exports = {
  sendEmail,
  sendPush,
  logNotification,
  notifyAdminsNewSignup,
  notifyLowStock,
  notifyExpiryAlert,
  notifyOrderStatus,
};