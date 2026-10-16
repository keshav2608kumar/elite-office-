const express = require('express');
const router = express.Router();
const adminCategoryController = require('../../controllers/admin/adminCategoryController');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
  .get(adminCategoryController.getCategories)
  .post(adminCategoryController.createCategory);

router.route('/:id')
  .put(adminCategoryController.updateCategory)
  .delete(authorize('superadmin'), adminCategoryController.deleteCategory);

module.exports = router;
