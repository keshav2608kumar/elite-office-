const Brand = require('../../models/Brand');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const ApiFeatures = require('../../utils/apiFeatures');
const { createAuditLog } = require('../../middleware/auditLog');

exports.getBrands = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(Brand.find(), req.query).filter().sort().limitFields().paginate();
  const brands = await features.query;
  const total = await new ApiFeatures(Brand.find(), req.query).filter().query.countDocuments();

  res.status(200).json({ status: 'success', results: brands.length, meta: { total, page: req.query.page * 1 || 1 }, data: { brands } });
});

exports.createBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.create(req.body);
  await createAuditLog('brand_created', req.admin.id, { brandId: brand._id, name: brand.name });
  res.status(201).json({ status: 'success', data: { brand } });
});

exports.updateBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!brand) return next(new AppError('No brand found with that ID', 404));
  await createAuditLog('brand_updated', req.admin.id, { brandId: brand._id });
  res.status(200).json({ status: 'success', data: { brand } });
});

exports.deleteBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) return next(new AppError('No brand found with that ID', 404));
  await createAuditLog('brand_deleted', req.admin.id, { brandId: brand._id });
  res.status(204).json({ status: 'success', data: null });
});
