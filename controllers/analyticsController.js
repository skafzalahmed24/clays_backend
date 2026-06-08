const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { successResponse } = require('../utils/responseHelper');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// @desc    Get dashboard stats (users, orders, sales)
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Total Users
    const totalUsers = await User.count();

    // 2. Total Orders
    const totalOrders = await Order.count();

    // 3. Total Sales (Revenue) - Sum of all paid orders
    const totalSales = await Order.sum('totalPrice', { where: { isPaid: true } }) || 0;

    // 4. Pending Orders
    const pendingOrders = await Order.count({ where: { isDelivered: false } });

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

    // Group sales and count orders by date formatted as YYYY-MM-DD
    const salesData = await Order.findAll({
        attributes: [
            [sequelize.literal("TO_CHAR(\"createdAt\", 'YYYY-MM-DD')"), '_id'],
            [sequelize.fn('SUM', sequelize.col('totalPrice')), 'sales'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
        ],
        where: {
            createdAt: {
                [Op.gte]: last7Days
            }
        },
        group: [sequelize.literal("TO_CHAR(\"createdAt\", 'YYYY-MM-DD')")],
        order: [[sequelize.literal("TO_CHAR(\"createdAt\", 'YYYY-MM-DD')"), 'ASC']],
        raw: true
    });

    const formattedSalesData = salesData.map(item => ({
        _id: item._id,
        sales: parseFloat(item.sales || 0),
        orders: parseInt(item.orders || 0)
    }));

    successResponse(res, formattedSalesData);
});

module.exports = {
    getDashboardStats,
    getSalesData
};
