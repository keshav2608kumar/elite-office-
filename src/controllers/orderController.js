const Order = require('../models/Order');
const Product = require('../models/Product');
const Counter = require('../models/Counter'); // Counter model for atomic order numbers
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { sendOrderConfirmation } = require('../services/emailService');

const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const prefix = `EOT-${year}${month}${day}-`;

  const counter = await Counter.findByIdAndUpdate(
    { _id: 'orderNumber' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqStr = String(counter.seq).padStart(6, '0');
  return `${prefix}${seqStr}`;
};

exports.createOrder = asyncHandler(async (req, res, next) => {
  const { customerInfo, shippingAddress, billingAddress, items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Order must contain at least one item', 400));
  }

  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });

  const orderItems = [];
  let subtotal = 0; // in paise

  for (const item of items) {
    const product = products.find(p => p._id.toString() === item.productId.toString());
    
    if (!product) {
      return next(new AppError(`Product with ID ${item.productId} not found or inactive`, 400));
    }

    if (product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name}`, 400));
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      productId: product._id,
      name: product.name,
      price: product.price, // Server side price
      quantity: item.quantity,
      itemTotal
    });
  }

  // Calculate taxes
  const taxRate = parseInt(process.env.DEFAULT_TAX_RATE || '18', 10);
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const totalAmount = subtotal + taxAmount; // add shipping here if applicable

  const orderNumber = await generateOrderNumber();

  const newOrder = await Order.create({
    orderNumber,
    customerInfo,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    items: orderItems,
    subtotal,
    taxAmount,
    totalAmount,
    status: 'pending',
    paymentStatus: 'pending'
  });

  // Decrement stock
  const bulkStockUpdates = orderItems.map(item => ({
    updateOne: {
      filter: { _id: item.productId },
      update: { $inc: { stock: -item.quantity } }
    }
  }));
  await Product.bulkWrite(bulkStockUpdates);

  res.status(201).json({
    status: 'success',
    data: {
      order: newOrder
    }
  });
});

exports.getOrderByNumber = asyncHandler(async (req, res, next) => {
  const { orderNumber } = req.params;
  const { email } = req.query;

  if (!email) {
    return next(new AppError('Email is required to view order details', 400));
  }

  const order = await Order.findOne({ orderNumber }).select('-__v');

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Verification step
  if (order.customerInfo.email.toLowerCase() !== email.toLowerCase()) {
    return next(new AppError('Unauthorized access to order details', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});
