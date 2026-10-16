const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const createOrderValidation = [
  body('orderId').isMongoId().withMessage('Valid internal order ID is required')
];

const verifyPaymentValidation = [
  body('razorpay_order_id').notEmpty().withMessage('Razorpay Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Razorpay Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Razorpay Signature is required')
];

router.post('/create-order', createOrderValidation, validate, paymentController.createPaymentOrder);
router.post('/verify', verifyPaymentValidation, validate, paymentController.verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
