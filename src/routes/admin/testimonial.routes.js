const express = require('express');
const router = express.Router();
const adminTestimonialController = require('../../controllers/admin/adminTestimonialController');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
  .get(adminTestimonialController.getTestimonials)
  .post(adminTestimonialController.createTestimonial);

router.route('/:id')
  .put(adminTestimonialController.updateTestimonial)
  .delete(authorize('superadmin'), adminTestimonialController.deleteTestimonial);

module.exports = router;
