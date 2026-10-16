const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

exports.validateCart = asyncHandler(async (req, res, next) => {
  const { items } = req.body; // Expecting [{ productId, quantity }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Cart is empty or invalid format', 400));
  }

  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  const validatedItems = [];
  let subtotal = 0; // In paise
  const errors = [];

  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.productId.toString());
    
    if (!product) {
      errors.push(`Product with ID ${item.productId} not found or inactive`);
      continue;
    }

    if (product.stock < item.quantity) {
      errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      continue;
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    validatedItems.push({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price, // Server-side price in paise
      quantity: item.quantity,
      itemTotal,
      image: product.images && product.images.length > 0 ? product.images[0] : null
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Cart validation failed',
      errors
    });
  }

  // Calculate tax (e.g., 18% GST default)
  const taxRate = parseInt(process.env.DEFAULT_TAX_RATE || '18', 10);
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + taxAmount;

  res.status(200).json({
    status: 'success',
    data: {
      items: validatedItems,
      summary: {
        subtotal,
        taxAmount,
        total,
        currency: 'INR'
      }
    }
  });
});
