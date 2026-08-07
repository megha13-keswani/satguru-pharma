const PDFDocument = require('pdfkit');
const { v4: uuid } = require('uuid');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { sendEmail } = require('./notification.service');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const invoiceDir = path.join(__dirname, '../../uploads/invoices');
fs.mkdirSync(invoiceDir, { recursive: true });

async function nextInvoiceNumber() {
  const count = await prisma.invoice.count();
  const year = new Date().getFullYear();
  return `SGP-INV-${year}-${String(count + 1).padStart(6, '0')}`;
}

function buildPdfBuffer(order, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#1A3C6E').fontSize(22).text('Satguru Pharma', { continued: false });
    doc.fillColor('#333').fontSize(9).text('Wholesale Medicine Distribution');
    doc.moveDown(0.5);
    doc.strokeColor('#1A3C6E').lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown();

    const shop = order.shop;
    doc.fillColor('#000').fontSize(11);
    doc.text(`Invoice #: ${invoiceNumber}`);
    doc.text(`Order #: ${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Billed To:');
    doc.font('Helvetica').text(shop.shopName);
    doc.text(`GSTIN: ${shop.gstNumber}`);
    doc.text(`Drug License: ${shop.drugLicenseNumber}`);
    doc.text(shop.address);
    doc.moveDown();

    const tableTop = doc.y;
    const cols = [40, 150, 205, 260, 305, 350, 400, 450, 500];
    const headers = ['Medicine', 'Batch', 'Expiry', 'HSN', 'Qty', 'MRP', 'Rate', 'GST%', 'Total'];
    doc.font('Helvetica-Bold').fontSize(8);
    headers.forEach((h, i) => doc.text(h, cols[i], tableTop, { width: (cols[i + 1] || 555) - cols[i] }));
    doc.moveTo(40, tableTop + 14).lineTo(555, tableTop + 14).stroke();

    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(8);
    order.items.forEach((item) => {
      const row = [
        item.medicineName,
        item.batchNumber || '-',
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : '-',
        item.hsnCode,
        `${item.quantityStrips} strips`,
        `Rs.${item.mrp.toFixed(2)}`,
        `Rs.${item.rate.toFixed(2)}`,
        `${item.gstPercent}%`,
        `Rs.${item.total.toFixed(2)}`,
      ];
      row.forEach((val, i) => doc.text(String(val), cols[i], y, { width: (cols[i + 1] || 555) - cols[i] }));
      y += 16;
      if (y > 720) { doc.addPage(); y = 40; }
    });

    doc.moveTo(40, y + 4).lineTo(555, y + 4).stroke();
    y += 14;
    doc.font('Helvetica-Bold');
    doc.text(`Subtotal: Rs.${order.subtotal.toFixed(2)}`, 400, y, { width: 155, align: 'right' });
    y += 14;
    doc.text(`Total GST: Rs.${order.gstTotal.toFixed(2)}`, 400, y, { width: 155, align: 'right' });
    y += 14;
    doc.fontSize(11).text(`Grand Total: Rs.${order.grandTotal.toFixed(2)}`, 400, y, { width: 155, align: 'right' });
    y += 30;

    doc.fontSize(9).font('Helvetica').text(`Payment Terms: ${order.paymentTerm}`, 40, y);
    y += 40;
    doc.text('Authorized Signature: _____________________', 40, y);
    doc.text('Receiver Signature: _____________________', 320, y);

    doc.moveDown(2);
    doc.fontSize(7).fillColor('#888').text(
      'This invoice is generated in a MARG-compatible format for direct accounting sync.',
      40, doc.page.height - 60
    );

    doc.end();
  });
}

async function generateAndSendInvoice(orderId, shopEmail) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { shop: true, items: true },
  });
  if (!order) throw new Error('Order not found for invoice generation');

  const invoiceNumber = await nextInvoiceNumber();
  const pdfBuffer = await buildPdfBuffer(order, invoiceNumber);

  const filename = `${order.id}-${uuid()}.pdf`;
  fs.writeFileSync(path.join(invoiceDir, filename), pdfBuffer);
  const pdfUrl = `${BACKEND_URL}/uploads/invoices/${filename}`;

  const invoice = await prisma.invoice.create({
    data: { orderId: order.id, invoiceNumber, pdfUrl },
  });

  sendEmail({
    to: shopEmail,
    subject: `Invoice ${invoiceNumber} for Order ${order.orderNumber}`,
    html: `<p>Please find attached the invoice for your order <b>${order.orderNumber}</b>. Total: Rs.${order.grandTotal.toFixed(2)}</p>`,
    attachments: [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }],
  }).catch((e) => console.error('Invoice email failed (non-blocking):', e.message));

  await prisma.invoice.update({ where: { id: invoice.id }, data: { emailedAt: new Date() } });

  return invoice;
}

module.exports = { generateAndSendInvoice, buildPdfBuffer, nextInvoiceNumber };