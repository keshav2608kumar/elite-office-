const Testimonial = require('../models/Testimonial');
const asyncHandler = require('../utils/asyncHandler');

exports.getTestimonials = asyncHandler(async (req, res, next) => {
  const testimonials = await Testimonial.find({ isActive: true })
    .sort('displayOrder')
    .select('-__v -createdAt -updatedAt');

  res.status(200).json({
    status: 'success',
    results: testimonials.length,
    data: {
      testimonials
    }
  });
});
