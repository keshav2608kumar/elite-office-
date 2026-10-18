const { body, query } = require('express-validator');
const mongoose = require('mongoose');

const createOrder = [
  body('customer.name')
    .trim()
    .notEmpty().withMessage('Contact name is required'),
  body('customer.email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('customer.phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be at least 10 digits')
    .matches(/^[0-9+\s-]+$/).withMessage('Please provide a valid phone number'),
  body('customer.address.pincode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 4, max: 10 }).withMessage('Pincode must be valid'),
  body('items')
    .isArray({ min: 1 }).withMessage('Enquiry must contain at least one item'),
  body('items.*')
    .custom((item) => {
      const id = item.productId || item.product;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Valid product ID is required');
      }
      const qty = parseInt(item.quantity, 10);
      if (!qty || qty < 1) {
        throw new Error('Quantity must be at least 1');
      }
      return true;
    })
];

const getOrder = [
  query('email')
    .optional({ checkFalsy: true })
    .isEmail().withMessage('Valid email query parameter is required')
];

module.exports = {
  createOrder,
  getOrder
};
