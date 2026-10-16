const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const validate = require('../middleware/validate');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: 'Too many contact requests from this IP, please try again after an hour'
});

const contactValidation = [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().trim().escape(),
  body('subject').notEmpty().withMessage('Subject is required').trim().escape(),
  body('message').notEmpty().withMessage('Message is required')
];

router.post('/', contactLimiter, contactValidation, validate, contactController.submitEnquiry);

module.exports = router;
