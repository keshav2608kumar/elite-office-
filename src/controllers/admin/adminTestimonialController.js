const Testimonial = require('../../models/Testimonial');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const ApiFeatures = require('../../utils/apiFeatures');
const { createAuditLog } = require('../../middleware/auditLog');

exports.getTestimonials = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(Testimonial.find(), req.query).filter().sort().limitFields().paginate();
  const testimonials = await features.query;
  const total = await new ApiFeatures(Testimonial.find(), req.query).filter().query.countDocuments();

  res.status(200).json({ status: 'success', results: testimonials.length, meta: { total, page: req.query.page * 1 || 1 }, data: { testimonials } });
});

exports.createTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.create(req.body);
  await createAuditLog('testimonial_created', req.admin.id, { testimonialId: testimonial._id, name: testimonial.clientName });
  res.status(201).json({ status: 'success', data: { testimonial } });
});

exports.updateTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!testimonial) return next(new AppError('No testimonial found with that ID', 404));
  await createAuditLog('testimonial_updated', req.admin.id, { testimonialId: testimonial._id });
  res.status(200).json({ status: 'success', data: { testimonial } });
});

exports.deleteTestimonial = asyncHandler(async (req, res, next) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) return next(new AppError('No testimonial found with that ID', 404));
  await createAuditLog('testimonial_deleted', req.admin.id, { testimonialId: testimonial._id });
  res.status(204).json({ status: 'success', data: null });
});
