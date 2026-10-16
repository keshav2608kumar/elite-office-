const express = require('express');
const router = express.Router();
const adminAuditController = require('../../controllers/admin/adminAuditController');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('superadmin'));

router.get('/', adminAuditController.getAuditLogs);

module.exports = router;
