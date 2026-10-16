const Category = require('../../models/Category');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const ApiFeatures = require('../../utils/apiFeatures');
const { createAuditLog } = require('../../middleware/auditLog');

exports.getCategories = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(Category.find(), req.query).filter().sort().limitFields().paginate();
  const categories = await features.query;
  const total = await new ApiFeatures(Category.find(), req.query).filter().query.countDocuments();

  res.status(200).json({
    status: 'success',
    results: categories.length,
    meta: { total, page: req.query.page * 1 || 1 },
    data: { categories }
  });
});

exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);
  await createAuditLog('category_created', req.admin.id, { categoryId: category._id, name: category.name });

  res.status(201).json({ status: 'success', data: { category } });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return next(new AppError('No category found with that ID', 404));

  await createAuditLog('category_updated', req.admin.id, { categoryId: category._id });

  res.status(200).json({ status: 'success', data: { category } });
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('No category found with that ID', 404));

  await createAuditLog('category_deleted', req.admin.id, { categoryId: category._id });

  res.status(204).json({ status: 'success', data: null });
});
