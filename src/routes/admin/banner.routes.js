const express = require('express');
const adminBannerController = require('../../controllers/admin/adminBannerController');
const { protect, authorize } = require('../../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('superadmin', 'admin', 'manager'));

router.route('/')
  .get(adminBannerController.getAllBanners)
  .post(adminBannerController.createBanner);

router.route('/:id')
  .patch(adminBannerController.updateBanner)
  .delete(adminBannerController.deleteBanner);

module.exports = router;
