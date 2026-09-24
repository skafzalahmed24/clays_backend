const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    getMyOrders,
    getOrders,
    updateOrderToDelivered,
    updateOrderStatus,
    cancelOrder,
    createRazorpayOrder,
    verifyRazorpayPayment,
    createDelhiveryShipment,
} = require('../controllers/orderController');
const { protect, admin, protectAdmin } = require('../middleware/authMiddleware');

router.route('/').post(protect, addOrderItems).get(protectAdmin, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/razorpay-order').post(protect, createRazorpayOrder);
router.route('/:id/razorpay-verify').post(protect, verifyRazorpayPayment);
router.route('/:id/deliver').put(protectAdmin, admin, updateOrderToDelivered);
router.route('/:id/status').put(protectAdmin, admin, updateOrderStatus);
router.route('/:id/shipment').post(protectAdmin, admin, createDelhiveryShipment);
router.route('/:id/cancel').put(protect, cancelOrder);
router.post('/track', require('../controllers/orderController').trackOrder);

module.exports = router;
