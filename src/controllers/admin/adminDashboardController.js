const Order = require('../../models/Order');
const Product = require('../../models/Product');
const asyncHandler = require('../../utils/asyncHandler');

exports.getStats = asyncHandler(async (req, res, next) => {
  // Total Revenue (Paid Orders)
  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
  ]);
  const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

  // Order Count by Status
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Pending Orders Count
  const pendingOrders = await Order.countDocuments({ status: 'pending' });

  // Low Stock Products
  const lowStockProducts = await Product.find({ stock: { $lt: 10 }, isActive: true })
    .select('name stock sku price')
    .limit(10);

  // Recent Orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderNumber totalAmount status createdAt paymentStatus customerInfo.name');

  // Revenue by Day (Last 30 Days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const revenueByDay = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: '$totalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalRevenue,
      ordersByStatus,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      revenueByDay
    }
  });
});
