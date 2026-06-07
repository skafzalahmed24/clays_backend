const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { successResponse } = require('../utils/responseHelper');

// @desc    Get dashboard stats (users, orders, sales)
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Total Users
    const totalUsers = await User.countDocuments();

    // 2. Total Orders
    const totalOrders = await Order.countDocuments();

    // 3. Total Sales (Revenue) - Sum of all paid orders
    const sales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$totalPrice' }
            }
        }
    ]);
    const totalSales = sales.length > 0 ? sales[0].totalSales : 0;

    // 4. Pending Orders
    const pendingOrders = await Order.countDocuments({ isDelivered: false });

    successResponse(res, {
        totalUsers,
        totalOrders,
        totalSales,
        pendingOrders
    });
});

// @desc    Get sales data for charts (last 7 days)
// @route   GET /api/analytics/sales
// @access  Private/Admin
const getSalesData = asyncHandler(async (req, res) => {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const salesData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: last7Days } // Filter last 7 days
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                sales: { $sum: "$totalPrice" },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } } // Sort by date
    ]);

    // Fill in missing days with 0 (optional, but good for charts)
    // For MVP, just returning what we have is fine, frontend can handle gaps or we can improve later.

    successResponse(res, salesData);
});

module.exports = {
    getDashboardStats,
    getSalesData
};
