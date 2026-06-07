const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        // itemsPrice, // Ignored from frontend for security
        // taxPrice, 
        // shippingPrice, 
        // totalPrice,
        coupon // Expecting whole coupon object if applied
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        // 1. Fetch real products from DB to get actual prices
        // orderItems from frontend: [{ product: ID, qty: 1, ... }]
        const productIds = orderItems.map(item => item.product);
        const dbProducts = await require('../models/Product').find({ _id: { $in: productIds } });

        // 2. Validate and Recalculate Items Price
        let calculatedItemsPrice = 0;
        const finalOrderItems = [];

        for (const item of orderItems) {
            const dbProduct = dbProducts.find(p => p._id.toString() === item.product);
            
            if (!dbProduct) {
                res.status(404);
                throw new Error(`Product not found: ${item.product}`);
            }

            // Optional: Check stock
            if (dbProduct.stock < item.qty) {
                 res.status(400);
                 throw new Error(`Product ${dbProduct.name} is out of stock`);
            }

            // Use DB price
            calculatedItemsPrice += dbProduct.price * item.qty;

            // Prepare item for order (ensure consistent data)
            finalOrderItems.push({
                ...item,
                price: dbProduct.price, // Force DB price
                name: dbProduct.name,
                image: dbProduct.img // Assuming 'img' is field name
            });
        }

        // 3. Recalculate Shipping & Tax (Simplified logic for now)
        // You can make this dynamic based on address/settings later
        const GeneralSetting = require('../models/GeneralSetting');
        const settings = await GeneralSetting.findOne();
        
        const shippingPrice = calculatedItemsPrice > 1000 ? 0 : 0; // Example rule, currently 0
        const taxRate = settings ? (settings.taxRate || 0) : 0;
        const taxPrice = Number((calculatedItemsPrice * (taxRate / 100)).toFixed(2));

        // 4. Apply Coupon if exists
        let discount = 0;
        if (coupon && coupon.discount) {
             // Verify coupon again server side if strict, but for now trusting the validated code passed
             // Better: re-validate coupon code here
             discount = Number(coupon.discount) || 0;
        }

        const totalPrice = calculatedItemsPrice + shippingPrice + taxPrice - discount;

        const order = new Order({
            orderItems: finalOrderItems,
            user: req.user._id,
            shippingAddress,
            paymentMethod,
            itemsPrice: calculatedItemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            isPaid: false
        });

        const createdOrder = await order.save();

        // Decrement Stock
        if (createdOrder) {
            const bulkOptions = finalOrderItems.map((item) => {
                return {
                    updateOne: {
                        filter: { _id: item.product },
                        update: { $inc: { stock: -item.qty } },
                    },
                };
            });
            await require('../models/Product').bulkWrite(bulkOptions);
        }

        // Clear user's cart after successful order
        if (req.user) {
            try {
                await User.findByIdAndUpdate(req.user._id, { cart: [] });
            } catch (error) {
                console.error('Failed to clear cart:', error);
            }
        }

        // Send Order Confirmation Email
        try {
            const { sendOrderEmail } = require('../utils/emailService');
            await sendOrderEmail(createdOrder, req.user);
        } catch (error) {
            console.error('Order email send failed:', error);
        }

        res.status(201).json(createdOrder);
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
        'user',
        'name email addresses'
    );

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
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
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

const { successResponse } = require('../utils/responseHelper');

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

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
    
    // Build filter query
    const query = {};
    
    // Search by order ID (convert ObjectId to string for comparison)
    if (search) {
        query.$expr = {
            $regexMatch: {
                input: { $toString: '$_id' },
                regex: search,
                options: 'i'
            }
        };
    }
    
    // Filter by status
    if (status && status !== 'All') {
        query.status = status;
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with pagination
    const orders = await Order.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skip);
    
    // Get total count for pagination
    const total = await Order.countDocuments(query);
    
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
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        // Also update status string if used
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
    const order = await Order.findById(req.params.id);

    if (order) {
        // Prevent changing status of delivered or cancelled orders
        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            res.status(400);
            throw new Error(`Cannot update status of ${order.status} orders. This is a final status.`);
        }

        order.status = req.body.status;
        if (req.body.status === 'Delivered') {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }
        if (req.body.status === 'Cancelled') {
            order.cancelledAt = Date.now();
        }
        
        const updatedOrder = await order.save();

        // Send Status Update Email
        try {
            const user = await User.findById(order.user);
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
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify order belongs to user (unless admin)
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401);
        throw new Error('Not authorized to cancel this order');
    }

    // Only allow cancellation of pending/processing orders
    const cancellableStatuses = ['Pending', 'Processing', 'Confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
        res.status(400);
        throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    order.status = 'Cancelled';
    order.cancelledAt = Date.now();

    const updatedOrder = await order.save();

    // Send Cancellation Email
    try {
        const user = await User.findById(order.user);
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

    // Since IDs in MongoDB are ObjectIds, we might need to handle short IDs if you implemented them, 
    // but assuming standard Hex string or specific logic:
    // For now assuming user provides full ID or the last 6 chars are used for display but full ID is needed for tracking
    // OR we can search by last 6 chars. Let's try exact match on ID first for security.
    
    let order;
    
    // 1. Try exact match if it looks like a full ObjectId
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(orderId).populate('user', 'name email');
    } else {
        // 2. Try matching by last 6-8 characters (commonly used for display)
        // We use $expr and $regexMatch to search within the stringified ID
        order = await Order.findOne({
            $expr: {
                $regexMatch: {
                    input: { $toString: '$_id' },
                    regex: `${orderId}$`, // Ends with the provided short ID
                    options: 'i'
                }
            }
        }).populate('user', 'name email');
    }

    if (!order) {
        res.status(404);
        throw new Error('Order not found. Please check your Order ID.');
    }

    // Verification Logic
    let isVerified = false;

    // 1. Verify Email (Check user email OR payment email)
    if (email) {
        const userEmail = order.user?.email || '';
        const paymentEmail = order.paymentResult?.email_address || '';
        if ((userEmail.toLowerCase() === email.toLowerCase()) || 
            (paymentEmail.toLowerCase() === email.toLowerCase())) {
            isVerified = true;
        }
    }

    // 2. Verify Phone (Check shipping address phone)
    if (!isVerified && phone) {
        const orderPhone = order.shippingAddress?.phone || '';
        // Basic normalization (remove spaces/dashes) for comparison if needed, 
        // but exact match is safer for now.
        if (orderPhone.replace(/\s/g, '') === phone.replace(/\s/g, '')) {
            isVerified = true;
        }
    }

    if (!isVerified) {
         res.status(404);
         throw new Error('Order verification failed. Please check your email or mobile number.');
    }

    // Return public safe tracking info
    const timeline = [
        { status: 'Order Placed', date: order.createdAt, completed: true },
        { status: 'Processing', date: order.createdAt, completed: true }, // Simplified
        { status: 'Shipped', date: order.isDelivered ? order.deliveredAt : null, completed: order.status === 'Shipped' || order.status === 'Delivered' },
        { status: 'Out for Delivery', date: null, completed: order.status === 'Delivered' }, // Simplified logic
        { status: 'Delivered', date: order.deliveredAt, completed: order.isDelivered }
    ];

    res.json({
        id: order._id,
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
