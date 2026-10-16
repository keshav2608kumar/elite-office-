const Brand = require('../models/Brand');
const asyncHandler = require('../utils/asyncHandler');

exports.getBrands = asyncHandler(async (req, res, next) => {
  const brands = await Brand.find({ isActive: true })
    .sort('displayOrder')
    .select('-__v -createdAt -updatedAt');

  res.status(200).json({
    status: 'success',
    results: brands.length,
    data: {
      brands
    }
  });
});
