const express = require('express');
const router = express.Router();
const adminOrderController = require('../../controllers/admin/adminOrderController');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('superadmin', 'admin'));

router.route('/')
  .get(adminOrderController.getOrders);

router.route('/:id')
  .get(adminOrderController.getOrderById);

router.route('/:id/status')
  .put(adminOrderController.updateOrderStatus);

router.route('/:id/note')
  .post(adminOrderController.addOrderNote);

module.exports = router;
