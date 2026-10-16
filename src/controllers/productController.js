const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const ApiFeatures = require('../utils/apiFeatures'); // Assuming this exists

exports.getProducts = asyncHandler(async (req, res, next) => {
  // Only active products
  const baseQuery = Product.find({ isActive: true }).select('-__v -metaTitle -metaDescription');
  
  const features = new ApiFeatures(baseQuery, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const products = await features.query;

  // For pagination metadata, we need to count total documents matching the filter
  const filterQuery = new ApiFeatures(Product.find({ isActive: true }), req.query).filter().query;
  const total = await filterQuery.countDocuments();

  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: 'success',
    results: products.length,
    meta: {
      total,
      page,
      limit,
      totalPages
    },
    data: {
      products
    }
  });
});

exports.getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ isActive: true, featured: true })
    .limit(8)
    .select('-__v -metaTitle -metaDescription');

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

exports.getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .select('-__v');

  if (!product) {
    return next(new AppError('No product found with that slug', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
});

exports.getRelatedProducts = asyncHandler(async (req, res, next) => {
  const currentProduct = await Product.findOne({ slug: req.params.slug, isActive: true });

  if (!currentProduct) {
    return next(new AppError('Product not found', 404));
  }

  const relatedProducts = await Product.find({
    category: currentProduct.category,
    _id: { $ne: currentProduct._id },
    isActive: true
  })
    .limit(4)
    .select('-__v -metaTitle -metaDescription');

  res.status(200).json({
    status: 'success',
    results: relatedProducts.length,
    data: {
      products: relatedProducts
    }
  });
});
