const ContactEnquiry = require('../models/ContactEnquiry');
const { sendContactNotification } = require('../services/emailService');
const asyncHandler = require('../utils/asyncHandler');
const sanitizeHtml = require('sanitize-html'); // Ensure this is installed, or we can just use a simple replacer. Assuming it's available or we sanitize manually

exports.submitEnquiry = asyncHandler(async (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;

  // Basic HTML sanitization for message
  const sanitizedMessage = sanitizeHtml ? sanitizeHtml(message, {
    allowedTags: [],
    allowedAttributes: {}
  }) : message.replace(/<[^>]*>?/gm, ''); // Fallback

  const newEnquiry = await ContactEnquiry.create({
    name,
    email,
    phone,
    subject,
    message: sanitizedMessage
  });

  // Non-blocking notification send
  sendContactNotification(newEnquiry).catch(err => console.error('Failed to send contact notification', err));

  res.status(201).json({
    status: 'success',
    message: 'Enquiry submitted successfully'
  });
});
