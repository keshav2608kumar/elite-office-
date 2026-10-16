const Config = require('../../models/SiteConfig');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { createAuditLog } = require('../../middleware/auditLog');

exports.getConfigs = asyncHandler(async (req, res, next) => {
  const configs = await Config.find();
  
  const configObj = {};
  configs.forEach(c => {
    configObj[c.key] = c.value;
  });

  res.status(200).json({
    status: 'success',
    data: { configs: configObj }
  });
});

exports.updateConfig = asyncHandler(async (req, res, next) => {
  const { key, value } = req.body;

  if (!key) {
    return next(new AppError('Config key is required', 400));
  }

  const config = await Config.findOneAndUpdate(
    { key },
    { value, updatedAt: Date.now() },
    { new: true, runValidators: true, upsert: true } // Creates if doesn't exist
  );

  await createAuditLog('config_updated', req.admin.id, { key, value });

  res.status(200).json({
    status: 'success',
    data: { config }
  });
});
