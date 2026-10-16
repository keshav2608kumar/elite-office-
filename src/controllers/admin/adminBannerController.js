const Banner = require('../../models/Banner');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { createAuditLog } = require('../../middleware/auditLog');

exports.getAllBanners = asyncHandler(async (req, res, next) => {
  const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: banners.length,
    data: { banners }
  });
});

exports.createBanner = asyncHandler(async (req, res, next) => {
  const newBanner = await Banner.create({
    title: req.body.title,
    subtitle: req.body.subtitle,
    image: req.body.image,
    ctaText: req.body.ctaText,
    ctaLink: req.body.ctaLink,
    displayOrder: req.body.displayOrder,
    isActive: req.body.isActive
  });

  await createAuditLog(req, 'banner_create', 'Banner', newBanner._id, { message: `Created banner: ${newBanner.title}` });

  res.status(201).json({
    status: 'success',
    data: { banner: newBanner }
  });
});

exports.updateBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!banner) {
    return next(new AppError('No banner found with that ID', 404));
  }

  await createAuditLog(req, 'banner_update', 'Banner', banner._id, { message: `Updated banner: ${banner.title}` });

  res.status(200).json({
    status: 'success',
    data: { banner }
  });
});

exports.deleteBanner = asyncHandler(async (req, res, next) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);

  if (!banner) {
    return next(new AppError('No banner found with that ID', 404));
  }

  await createAuditLog(req, 'banner_delete', 'Banner', banner._id, { message: `Deleted banner: ${banner.title}` });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
