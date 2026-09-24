const express = require('express');
const router = express.Router();
const {
    checkPincode,
    getLiveRate,
    getEstimate,
    getShippingSettings,
    updateShippingSettings,
    trackWaybill,
    getLabel,
    cancelWaybill,
    testDelhiveryConnection
} = require('../controllers/shippingController');
const { protect, admin, protectAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/pincode/:pincode', checkPincode);
router.post('/live-rate', getLiveRate);
router.post('/estimate', getEstimate);
router.get('/settings', getShippingSettings);
router.get('/track/:waybill', trackWaybill);

// Admin routes
router.put('/settings', protectAdmin, admin, updateShippingSettings);
router.get('/label/:waybill', protectAdmin, admin, getLabel);
router.post('/cancel/:waybill', protectAdmin, admin, cancelWaybill);
router.post('/test-connection', protectAdmin, admin, testDelhiveryConnection);

module.exports = router;
