const express = require('express');
const router = express.Router();
const adminAuthController = require('../../controllers/admin/adminAuthController');
const rateLimit = require('express-rate-limit');
const { protect } = require('../../middleware/auth'); // assuming protect handles auth

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts, please try again after 15 minutes'
});

router.post('/login', authLimiter, adminAuthController.login);
router.post('/refresh', adminAuthController.refreshToken);
router.post('/logout', protect, adminAuthController.logout);
router.post('/change-password', protect, adminAuthController.changePassword);

module.exports = router;
