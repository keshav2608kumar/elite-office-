const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { body, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many orders created from this IP, please try again after 15 minutes'
});

const createOrderValidation = [
  body('customerInfo.name').notEmpty().withMessage('Customer name is required'),
  body('customerInfo.email').isEmail().withMessage('Valid email is required'),
  body('customerInfo.phone').notEmpty().withMessage('Phone number is required'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

const getOrderValidation = [
  query('email').isEmail().withMessage('Valid email query parameter is required')
];

router.post('/', orderLimiter, createOrderValidation, validate, orderController.createOrder);
router.get('/:orderNumber', getOrderValidation, validate, orderController.getOrderByNumber);

module.exports = router;
