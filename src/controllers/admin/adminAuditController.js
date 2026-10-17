const AuditLog = require('../../models/AuditLog');
const asyncHandler = require('../../utils/asyncHandler');

exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.action) {
    filter.action = req.query.action;
  }

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .populate('actor', 'username email role')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: 'success',
    results: logs.length,
    meta: { total, page, totalPages: Math.ceil(total / limit) },
    data: { logs }
  });
});
