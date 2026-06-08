const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const GeneralSetting = require('../models/GeneralSetting');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { successResponse } = require('../utils/responseHelper');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        coupon
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        // 1. Fetch real products from DB to get actual prices
        const productIds = orderItems.map(item => item.product);
        const dbProducts = await Product.findAll({ where: { id: productIds } });

        // 2. Validate and Recalculate Items Price
        let calculatedItemsPrice = 0;
        const finalOrderItems = [];

        for (const item of orderItems) {
            const dbProduct = dbProducts.find(p => p.id === item.product);
            
            if (!dbProduct) {
                res.status(404);
                throw new Error(`Product not found: ${item.product}`);
            }

            if (dbProduct.stock < item.qty) {
                 res.status(400);
                 throw new Error(`Product ${dbProduct.name} is out of stock`);
            }

            calculatedItemsPrice += dbProduct.price * item.qty;

            finalOrderItems.push({
                ...item,
                price: dbProduct.price,
                name: dbProduct.name,
                image: dbProduct.img
            });
        }

        // 3. Recalculate Shipping & Tax
        const settings = await GeneralSetting.findOne();
        
        const shippingPrice = calculatedItemsPrice > 1000 ? 0 : 0;
        const taxRate = settings ? (settings.taxRate || 0) : 0;
        const taxPrice = Number((calculatedItemsPrice * (taxRate / 100)).toFixed(2));

        // 4. Apply Coupon if exists
        let discount = 0;
        if (coupon && coupon.discount) {
             discount = Number(coupon.discount) || 0;
        }

        const totalPrice = calculatedItemsPrice + shippingPrice + taxPrice - discount;

        const order = await Order.create({
            orderItems: finalOrderItems,
            userId: req.user.id,
            shippingAddress,
            paymentMethod,
            itemsPrice: calculatedItemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            isPaid: false
        });

        // Decrement Stock
        if (order) {
            await Promise.all(finalOrderItems.map(item =>
                Product.decrement('stock', { by: item.qty, where: { id: item.product } })
            ));
        }

        // Clear user's cart after successful order
        if (req.user) {
            try {
                await User.update({ cart: [] }, { where: { id: req.user.id } });
            } catch (error) {
                console.error('Failed to clear cart:', error);
            }
        }

        // Send Order Confirmation Email
        try {
            const { sendOrderEmail } = require('../utils/emailService');
            await sendOrderEmail(order, req.user);
        } catch (error) {
            console.error('Order email send failed:', error);
        }

        res.status(201).json(order);
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id, {
        include: [{
            model: User,
            as: 'user',
            attributes: ['name', 'email', 'addresses']
        }]
    });

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };

        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await Order.count({ where: { userId: req.user.id } });
    const orders = await Order.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        limit,
        offset: skip
    });

    successResponse(res, {
        orders,
        page,
        pages: Math.ceil(count / limit),
        total: count
    });
});

// @desc    Get all orders
// @route   GET /api/orders?search=&status=&page=&limit=
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const { search = '', status = '', page = 1, limit = 10 } = req.query;
    
    const whereClause = {};
    
    if (search) {
        whereClause[Op.and] = sequelize.literal(`CAST("Order"."id" AS VARCHAR) ILIKE '%${search}%'`);
    }
    
    if (status && status !== 'All') {
        whereClause.status = status;
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    const orders = await Order.findAll({
        where: whereClause,
        include: [{
            model: User,
            as: 'user',
            attributes: ['name', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset: skip
    });
    
    const total = await Order.count({ where: whereClause });
    
    res.json({
        orders,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        total
    });
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = new Date();
        order.status = 'Delivered';

        const updatedOrder = await order.save();

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);

    if (order) {
        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            res.status(400);
            throw new Error(`Cannot update status of ${order.status} orders. This is a final status.`);
        }

        order.status = req.body.status;
        if (req.body.status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = new Date();
        }
        if (req.body.status === 'Cancelled') {
            order.cancelledAt = new Date();
        }
        
        const updatedOrder = await order.save();

        // Send Status Update Email
        try {
            const user = await User.findByPk(order.userId);
            const { sendOrderStatusEmail } = require('../utils/emailService');
            if (user) {
                await sendOrderStatusEmail(updatedOrder, user);
            }
        } catch (error) {
            console.error('Failed to send status email:', error);
        }

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to cancel this order');
    }

    const cancellableStatuses = ['Pending', 'Processing', 'Confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
        res.status(400);
        throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    order.status = 'Cancelled';
    order.cancelledAt = new Date();

    const updatedOrder = await order.save();

    // Send Cancellation Email
    try {
        const user = await User.findByPk(order.userId);
        const { sendOrderStatusEmail } = require('../utils/emailService');
        if (user) {
            await sendOrderStatusEmail(updatedOrder, user);
        }
    } catch (error) {
        console.error('Failed to send cancellation email:', error);
    }

    res.json(updatedOrder);
});

// @desc    Track order
// @route   POST /api/orders/track
// @access  Public
const trackOrder = asyncHandler(async (req, res) => {
    const { orderId, email, phone } = req.body;

    if (!orderId || (!email && !phone)) {
        res.status(400);
        throw new Error('Please provide Order ID and either Email or Mobile Number');
    }

    let order;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(orderId)) {
        order = await Order.findByPk(orderId, {
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
        });
    } else {
        order = await Order.findOne({
            where: sequelize.literal(`CAST("Order"."id" AS VARCHAR) ILIKE '%${orderId}'`),
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
        });
    }

    if (!order) {
        res.status(404);
        throw new Error('Order not found. Please check your Order ID.');
    }

    let isVerified = false;

    if (email) {
        const userEmail = order.user?.email || '';
        const paymentEmail = order.paymentResult?.email_address || '';
        if ((userEmail.toLowerCase() === email.toLowerCase()) || 
            (paymentEmail.toLowerCase() === email.toLowerCase())) {
            isVerified = true;
        }
    }

    if (!isVerified && phone) {
        const orderPhone = order.shippingAddress?.phone || '';
        if (orderPhone.replace(/\s/g, '') === phone.replace(/\s/g, '')) {
            isVerified = true;
        }
    }

    if (!isVerified) {
         res.status(404);
         throw new Error('Order verification failed. Please check your email or mobile number.');
    }

    const timeline = [
        { status: 'Order Placed', date: order.createdAt, completed: true },
        { status: 'Processing', date: order.createdAt, completed: true },
        { status: 'Shipped', date: order.isDelivered ? order.deliveredAt : null, completed: order.status === 'Shipped' || order.status === 'Delivered' },
        { status: 'Out for Delivery', date: null, completed: order.status === 'Delivered' },
        { status: 'Delivered', date: order.deliveredAt, completed: order.isDelivered }
    ];

    res.json({
        id: order.id,
        status: order.status || 'Processing',
        date: order.createdAt,
        items: order.orderItems.length,
        total: order.totalPrice,
        timeline
    });
});

module.exports = {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
    updateOrderStatus,
    cancelOrder,
    trackOrder,
};
