const express = require('express');
const router = express.Router();
const {
    createCoupon,
    getCoupons,
    deleteCoupon,
    validateCoupon
} = require('../controllers/couponController');
const { protect, admin, protectAdmin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protectAdmin, admin, createCoupon)
    .get(protectAdmin, admin, getCoupons);

router.route('/:id')
    .delete(protectAdmin, admin, deleteCoupon);

router.post('/validate', protect, validateCoupon);

module.exports = router;
