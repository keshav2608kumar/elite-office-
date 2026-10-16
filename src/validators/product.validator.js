const { body, query } = require('express-validator');
const { validatePagination } = require('./common');

const createProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be between 3 and 200 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['IT & Office Equipment', 'Printing', 'Stationery']).withMessage('Invalid category'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('description')
    .optional()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('shortDescription')
    .optional()
    .isLength({ max: 500 }).withMessage('Short description cannot exceed 500 characters')
];

const updateProduct = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be between 3 and 200 characters'),
  body('category')
    .optional()
    .isIn(['IT & Office Equipment', 'Printing', 'Stationery']).withMessage('Invalid category'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('description')
    .optional()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('shortDescription')
    .optional()
    .isLength({ max: 500 }).withMessage('Short description cannot exceed 500 characters')
];

const getProducts = [
  ...validatePagination,
  query('sort').optional().isString(),
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('brand').optional().isString()
];

module.exports = {
  createProduct,
  updateProduct,
  getProducts
};
