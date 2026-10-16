const Order = require('../models/Order');
const { createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } = require('../services/paymentService');
const { sendOrderConfirmation } = require('../services/emailService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

exports.createPaymentOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body; // Internal mongo ID or order number

  const order = await Order.findById(orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  if (order.paymentStatus !== 'pending') {
    return next(new AppError('Order payment is already completed or failed', 400));
  }

  const receiptId = `receipt_${order.orderNumber}`;
  
  const razorpayOrder = await createRazorpayOrder(order.totalAmount, receiptId, {
    orderNumber: order.orderNumber,
    customerEmail: order.customerInfo.email
  });

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.status(200).json({
    status: 'success',
    data: {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID // Only send public key
    }
  });
});

exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Missing payment verification parameters', 400));
  }

  const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

  if (!order) {
    return next(new AppError('Order not found for this payment', 404));
  }

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    order.paymentStatus = 'failed';
    order.statusHistory.push({
      status: 'payment_failed',
      comment: 'Signature verification failed'
    });
    await order.save();
    return next(new AppError('Payment verification failed', 400));
  }

  order.paymentStatus = 'paid';
  order.razorpayPaymentId = razorpay_payment_id;
  order.statusHistory.push({
    status: 'processing',
    comment: 'Payment successful, order is now processing'
  });
  order.status = 'processing';
  
  await order.save();

  // Send confirmation email asynchronously
  sendOrderConfirmation(order).catch(err => logger.error('Error sending confirmation email', err));

  res.status(200).json({
    status: 'success',
    message: 'Payment verified successfully',
    data: {
      orderNumber: order.orderNumber
    }
  });
});

exports.handleWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody; // Assumes raw body is saved by express middleware

  try {
    verifyWebhookSignature(rawBody, signature);
  } catch (error) {
    logger.error('Webhook signature verification failed:', error);
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;

  // Immediately respond to prevent retries
  res.status(200).send('OK');

  try {
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const razorpayOrderId = event.payload.payment.entity.order_id;
      const razorpayPaymentId = event.payload.payment.entity.id;

      const order = await Order.findOne({ razorpayOrderId });
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = razorpayPaymentId;
        order.status = 'processing';
        order.statusHistory.push({
          status: 'processing',
          comment: 'Payment verified via webhook'
        });
        await order.save();
        
        sendOrderConfirmation(order).catch(err => logger.error('Webhook email error', err));
      }
    }
  } catch (error) {
    logger.error('Error processing webhook event:', error);
  }
});
