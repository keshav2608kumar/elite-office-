const { param, query, body } = require('express-validator');
const mongoose = require('mongoose');

const validateObjectId = (field) => {
  return param(field)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${field}`);
      }
      return true;
    });
};

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a number greater than or equal to 1')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be a number between 1 and 100')
    .toInt()
];

const sanitizeInput = (field) => {
  return body(field)
    .trim()
    .escape();
};

module.exports = {
  validateObjectId,
  validatePagination,
  sanitizeInput
};
