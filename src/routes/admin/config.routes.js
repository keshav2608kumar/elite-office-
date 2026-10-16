const express = require('express');
const router = express.Router();
const adminConfigController = require('../../controllers/admin/adminConfigController');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('superadmin'));

router.route('/')
  .get(adminConfigController.getConfigs)
  .put(adminConfigController.updateConfig);

module.exports = router;
