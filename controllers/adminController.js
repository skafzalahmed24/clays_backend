const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
// Helper to get date ranges
const getDateRanges = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return { currentMonthStart, lastMonthStart, lastMonthEnd };
};

const calculateGrowth = (current, previous) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const { currentMonthStart, lastMonthStart, lastMonthEnd } = getDateRanges();

        // 1. Total Revenue & Growth
        const allOrders = await Order.findAll();
        const totalRevenue = allOrders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
        
        const currentMonthRevenue = allOrders
            .filter(o => o.createdAt >= currentMonthStart)
            .reduce((acc, o) => acc + (o.totalPrice || 0), 0);
            
        const lastMonthRevenue = allOrders
            .filter(o => o.createdAt >= lastMonthStart && o.createdAt <= lastMonthEnd)
            .reduce((acc, o) => acc + (o.totalPrice || 0), 0);
            
        const revenueGrowth = calculateGrowth(currentMonthRevenue, lastMonthRevenue);

        // 2. Total Orders & Growth
        const totalOrders = allOrders.length;
        const currentMonthOrders = allOrders.filter(o => o.createdAt >= currentMonthStart).length;
        const lastMonthOrders = allOrders.filter(o => o.createdAt >= lastMonthStart && o.createdAt <= lastMonthEnd).length;
        const ordersGrowth = calculateGrowth(currentMonthOrders, lastMonthOrders);

        // 3. New Customers & Growth
        const allUsers = await User.findAll();
        const newCustomers = allUsers.length;
        const currentMonthUsers = allUsers.filter(u => u.createdAt >= currentMonthStart).length;
        const lastMonthUsers = allUsers.filter(u => u.createdAt >= lastMonthStart && u.createdAt <= lastMonthEnd).length;
        const customersGrowth = calculateGrowth(currentMonthUsers, lastMonthUsers);

        // 4. Recent Orders
        const recentOrders = await Order.findAll({
            order: [['createdAt', 'DESC']],
            limit: 5,
            include: [{
                model: User,
                as: 'user',
                attributes: ['name']
            }]
        });

        res.json({
            totalRevenue,
            revenueGrowth,
            totalOrders,
            ordersGrowth,
            newCustomers,
            customersGrowth,
            growth: revenueGrowth, // Overall growth primarily based on revenue
            recentOrders
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats,
};
