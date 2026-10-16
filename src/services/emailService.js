const nodemailer = require('nodemailer');
const logger = require('../utils/logger'); // assuming logger exists

const isConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const createTransporter = () => {
  if (!isConfigured()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email service is not configured. Skipping email send.');
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${process.env.BUSINESS_NAME || 'Elite Office Technologies'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error.message);
    return false;
  }
};

const sendOrderConfirmation = async (order) => {
  if (!order || !order.customerInfo || !order.customerInfo.email) return false;

  const subject = `Order Confirmation - ${order.orderNumber}`;
  const html = `
    <h1>Thank you for your order!</h1>
    <p>Your order number is: <strong>${order.orderNumber}</strong></p>
    <p>Total Amount: ₹${(order.totalAmount / 100).toFixed(2)}</p>
    <p>We will notify you once your order is shipped.</p>
  `;

  return sendEmail(order.customerInfo.email, subject, html);
};

const sendContactNotification = async (enquiry) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return false;

  const subject = `New Contact Enquiry from ${enquiry.name}`;
  const html = `
    <h2>New Contact Enquiry</h2>
    <p><strong>Name:</strong> ${enquiry.name}</p>
    <p><strong>Email:</strong> ${enquiry.email}</p>
    <p><strong>Phone:</strong> ${enquiry.phone || 'N/A'}</p>
    <p><strong>Subject:</strong> ${enquiry.subject || 'N/A'}</p>
    <p><strong>Message:</strong></p>
    <p>${enquiry.message}</p>
  `;

  return sendEmail(adminEmail, subject, html);
};

module.exports = {
  isConfigured,
  createTransporter,
  sendEmail,
  sendOrderConfirmation,
  sendContactNotification,
};
