const express = require('express');
const router = express.Router();
const adminBrandController = require('../../controllers/admin/adminBrandController');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
  .get(adminBrandController.getBrands)
  .post(adminBrandController.createBrand);

router.route('/:id')
  .put(adminBrandController.updateBrand)
  .delete(authorize('superadmin'), adminBrandController.deleteBrand);

module.exports = router;
