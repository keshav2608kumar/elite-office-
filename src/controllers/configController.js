const Config = require('../models/SiteConfig');
const asyncHandler = require('../utils/asyncHandler');

exports.getPublicConfig = asyncHandler(async (req, res, next) => {
  // Only return configs that are explicitly marked as public
  const configs = await Config.find({ isPublic: true }).select('key value -_id');
  
  // Transform to a key-value object
  const configObj = {};
  configs.forEach(c => {
    configObj[c.key] = c.value;
  });

  res.status(200).json({
    status: 'success',
    data: {
      config: configObj
    }
  });
});
