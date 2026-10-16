const { body } = require('express-validator');
const mongoose = require('mongoose');

const createOrder = [
  body('customer.name')
    .trim()
    .notEmpty().withMessage('Customer name is required'),
  body('customer.email')
    .trim()
    .notEmpty().withMessage('Customer email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('customer.phone')
    .trim()
    .notEmpty().withMessage('Customer phone is required')
    .isLength({ min: 10, max: 15 }).withMessage('Phone must be at least 10 digits')
    .matches(/^[0-9]+$/).withMessage('Phone must contain only numbers'),
  body('customer.address.pincode')
    .trim()
    .notEmpty().withMessage('Pincode is required')
    .isLength({ min: 6, max: 6 }).withMessage('Pincode must be exactly 6 digits')
    .matches(/^[0-9]+$/).withMessage('Pincode must contain only numbers'),
  body('items')
    .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.product')
    .notEmpty().withMessage('Product ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid product ID');
      }
      return true;
    }),
  body('items.*.quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100')
];

module.exports = {
  createOrder
};
