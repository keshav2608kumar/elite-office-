const AuditLog = require('../../models/AuditLog');
const asyncHandler = require('../../utils/asyncHandler');
const ApiFeatures = require('../../utils/apiFeatures');

exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(AuditLog.find().populate('adminId', 'username email'), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const logs = await features.query;
  const total = await new ApiFeatures(AuditLog.find(), req.query).filter().query.countDocuments();

  res.status(200).json({
    status: 'success',
    results: logs.length,
    meta: { total, page: req.query.page * 1 || 1 },
    data: { logs }
  });
});
