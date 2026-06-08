const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
    const { code, type, value, minOrderAmount, expiryDate, usageLimit } = req.body;

    const couponExists = await Coupon.findOne({ where: { code } });

    if (couponExists) {
        res.status(400);
        throw new Error('Coupon code already exists');
    }

    const coupon = await Coupon.create({
        code,
        type,
        value,
        minOrderAmount,
        expiryDate,
        usageLimit
    });

    res.status(201).json(coupon);
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Coupon.count();
    const coupons = await Coupon.findAll({
        order: [['createdAt', 'DESC']],
        offset: skip,
        limit: limit
    });

    res.json({
        coupons,
        page,
        pages: Math.ceil(total / limit),
        total
    });
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByPk(req.params.id);

    if (coupon) {
        await coupon.destroy();
        res.json({ message: 'Coupon removed' });
    } else {
        res.status(404);
        throw new Error('Coupon not found');
    }
});

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = asyncHandler(async (req, res) => {
    const { code, cartTotal } = req.body;

    const coupon = await Coupon.findOne({ where: { code, isActive: true } });

    if (!coupon) {
        res.status(404);
        throw new Error('Invalid coupon code');
    }

    // Check expiry
    if (new Date() > coupon.expiryDate) {
        res.status(400);
        throw new Error('Coupon has expired');
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        res.status(400);
        throw new Error('Coupon usage limit reached');
    }

    // Check min order amount
    if (cartTotal < coupon.minOrderAmount) {
        res.status(400);
        throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required`);
    }

    res.json({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: coupon.type === 'percentage' 
            ? (cartTotal * coupon.value) / 100 
            : coupon.value
    });
});

module.exports = {
    createCoupon,
    getCoupons,
    deleteCoupon,
    validateCoupon
};
