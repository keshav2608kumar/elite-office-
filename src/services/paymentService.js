const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger'); // assuming a logger exists

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const isConfigured = () => {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
};

const createRazorpayOrder = async (amount, receipt, notes = {}) => {
  if (!isConfigured()) {
    throw new Error('Razorpay is not configured');
  }

  const options = {
    amount: amount, // amount in paise
    currency: 'INR',
    receipt: receipt,
    notes: notes,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    throw new Error('Payment gateway error');
  }
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!isConfigured()) {
    throw new Error('Razorpay is not configured');
  }

  const text = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
};

const verifyWebhookSignature = (body, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Razorpay webhook secret is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body) // raw body string
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
};

module.exports = {
  isConfigured,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
