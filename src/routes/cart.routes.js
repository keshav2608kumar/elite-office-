const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const cartValidation = [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

router.post('/validate', cartValidation, validate, cartController.validateCart);

module.exports = router;
