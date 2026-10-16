const Banner = require('../models/Banner');
const asyncHandler = require('../utils/asyncHandler');

exports.getActiveBanners = asyncHandler(async (req, res, next) => {
  const banners = await Banner.find({ isActive: true })
    .sort({ displayOrder: 1, createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: banners.length,
    data: { banners }
  });
});
