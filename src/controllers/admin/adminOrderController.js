const Order = require('../../models/Order');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const ApiFeatures = require('../../utils/apiFeatures');
const { createAuditLog } = require('../../middleware/auditLog');

exports.getOrders = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(Order.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query;
  const total = await new ApiFeatures(Order.find(), req.query).filter().query.countDocuments();

  res.status(200).json({
    status: 'success',
    results: orders.length,
    meta: { total, page: req.query.page * 1 || 1 },
    data: { orders }
  });
});

exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { order }
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, comment } = req.body;
  const validStatuses = ['enquiry', 'pending', 'quote_prepared', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  order.orderStatus = status;
  if (comment || status) {
    order.statusHistory.push({
      status,
      note: comment || `Status updated to ${status} by admin`,
      updatedBy: req.admin?._id
    });
  }

  await order.save();

  await createAuditLog('order_status_updated', req.admin.id, { orderId: order._id, newStatus: status });

  res.status(200).json({
    status: 'success',
    data: { order }
  });
});

exports.addOrderNote = asyncHandler(async (req, res, next) => {
  const { note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError('No order found with that ID', 404));
  }

  order.adminNotes = order.adminNotes ? `${order.adminNotes}\n${note}` : note;
  await order.save();

  res.status(200).json({
    status: 'success',
    data: { order }
  });
});
