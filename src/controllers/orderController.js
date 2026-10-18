const Order = require('../models/Order');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
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
  const rawCustomer = req.body.customer || req.body.customerInfo || {};
  const rawAddress = req.body.shippingAddress || rawCustomer.address || {};
  const items = req.body.items;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError('Order enquiry must contain at least one item', 400));
  }

  // Normalize customer name and details
  const name = (rawCustomer.name || `${rawCustomer.firstName || ''} ${rawCustomer.lastName || ''}`).trim() || 'Valued Customer';
  const email = (rawCustomer.email || '').trim().toLowerCase();
  const phone = (rawCustomer.phone || '').trim();
  const company = (rawCustomer.company || '').trim();

  if (!email || !phone) {
    return next(new AppError('Customer email and phone number are required', 400));
  }

  // Normalize items array
  const normalizedItems = items.map(item => ({
    productId: (item.productId || item.product || '').toString(),
    quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
  })).filter(i => i.productId);

  if (normalizedItems.length === 0) {
    return next(new AppError('No valid products selected in enquiry', 400));
  }

  const productIds = normalizedItems.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  const orderItems = [];
  let subtotal = 0; // in paise

  for (const item of normalizedItems) {
    const product = products.find(p => p._id.toString() === item.productId);
    
    if (!product) {
      return next(new AppError(`Product not found or currently unavailable`, 400));
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku || '',
      price: product.price, // Server verified price
      quantity: item.quantity,
      total: itemTotal
    });
  }

  // Calculate taxes (18% GST standard)
  const taxRate = parseInt(process.env.DEFAULT_TAX_RATE || '18', 10);
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const totalAmount = subtotal + taxAmount;

  const orderNumber = await generateOrderNumber();

  // Create order enquiry record
  const newOrder = await Order.create({
    orderNumber,
    customer: {
      name,
      company,
      email,
      phone,
      address: {
        street: rawAddress.street || '',
        city: rawAddress.city || '',
        state: rawAddress.state || '',
        pincode: rawAddress.pincode || '',
        country: rawAddress.country || 'India'
      }
    },
    items: orderItems,
    subtotal,
    taxRate,
    taxAmount,
    shippingCost: 0,
    totalAmount,
    paymentMethod: req.body.paymentMethod || 'enquiry',
    paymentStatus: 'pending',
    orderStatus: 'enquiry',
    notes: req.body.notes || '',
    statusHistory: [{
      status: 'enquiry',
      timestamp: new Date(),
      note: 'Order enquiry and quotation request submitted'
    }]
  });

  // Soft stock adjustment if available
  try {
    const bulkStockUpdates = orderItems
      .filter(item => {
        const prod = products.find(p => p._id.toString() === item.product.toString());
        return prod && prod.stock >= item.quantity;
      })
      .map(item => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: -item.quantity } }
        }
      }));

    if (bulkStockUpdates.length > 0) {
      await Product.bulkWrite(bulkStockUpdates);
    }
  } catch (stockErr) {
    console.warn('Stock update skipped during enquiry:', stockErr.message);
  }

  // Send confirmation email asynchronously without blocking
  try {
    if (sendOrderConfirmation) {
      sendOrderConfirmation(newOrder).catch(err => {
        console.warn('Email confirmation notice skipped:', err.message);
      });
    }
  } catch (e) {}

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

  const order = await Order.findOne({ orderNumber }).populate('items.product').select('-__v');

  if (!order) {
    return next(new AppError('Order enquiry not found', 404));
  }

  // Verification step if email parameter was supplied
  if (email && order.customer && order.customer.email) {
    if (order.customer.email.toLowerCase() !== email.trim().toLowerCase()) {
      return next(new AppError('Unauthorized access: email does not match this enquiry', 403));
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      order
    }
  });
});
