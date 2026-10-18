const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { createOrder, getOrder } = require('../validators/order.validator');
const rateLimit = require('express-rate-limit');

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per windowMs
  message: 'Too many enquiry requests from this IP, please try again in a few minutes'
});

router.post('/', orderLimiter, createOrder, validate, orderController.createOrder);
router.get('/:orderNumber', getOrder, validate, orderController.getOrderByNumber);

module.exports = router;
