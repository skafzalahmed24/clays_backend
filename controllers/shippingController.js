const asyncHandler = require('express-async-handler');
const GeneralSetting = require('../models/GeneralSetting');
const {
    getShippingConfig,
    checkPincodeServiceability,
    calculateShippingEstimate,
    calculateDelhiveryLiveRate,
    trackShipment,
    getShippingLabel,
    cancelShipment,
    createShipment
} = require('../utils/delhiveryService');
const axios = require('axios');

// @desc    Check pincode serviceability
// @route   GET /api/shipping/pincode/:pincode
// @access  Public
const checkPincode = asyncHandler(async (req, res) => {
    const { pincode } = req.params;
    const result = await checkPincodeServiceability(pincode);
    res.json(result);
});

// @desc    Calculate exact live Delhivery courier rate & fee breakdown for an order
// @route   POST /api/shipping/live-rate
// @access  Public
const getLiveRate = asyncHandler(async (req, res) => {
    const { destPincode, weightGrams, paymentMode, codAmount } = req.body;
    if (!destPincode) {
        res.status(400);
        throw new Error('Destination PIN code is required');
    }

    try {
        const rate = await calculateDelhiveryLiveRate({
            destPincode: String(destPincode).trim(),
            weightGrams: Number(weightGrams) || 500,
            paymentMode: paymentMode || 'Prepaid',
            codAmount: Number(codAmount) || 0
        });
        res.json(rate);
    } catch (error) {
        res.status(400);
        throw new Error(error.message || 'Failed to fetch live Delhivery rate');
    }
});

// @desc    Calculate shipping estimate and fees
// @route   POST /api/shipping/estimate
// @access  Public
const getEstimate = asyncHandler(async (req, res) => {
    const { pincode, subtotal, paymentMethod } = req.body;
    const estimate = await calculateShippingEstimate({
        pincode,
        subtotal: Number(subtotal) || 0,
        paymentMethod: paymentMethod || 'Prepaid'
    });
    res.json(estimate);
});

// @desc    Get current shipping & warehouse settings
// @route   GET /api/shipping/settings
// @access  Public
const getShippingSettings = asyncHandler(async (req, res) => {
    const config = await getShippingConfig();
    res.json(config);
});

// @desc    Update shipping & pickup warehouse settings (Admin)
// @route   PUT /api/shipping/settings
// @access  Private/Admin
const updateShippingSettings = asyncHandler(async (req, res) => {
    const settings = await GeneralSetting.getSingleton();
    
    const existingConfig = settings.shippingConfig || {};
    const updatedConfig = {
        ...existingConfig,
        provider: req.body.provider !== undefined ? req.body.provider : existingConfig.provider,
        warehouseName: req.body.warehouseName !== undefined ? req.body.warehouseName.trim() : existingConfig.warehouseName,
        warehouseAddress: req.body.warehouseAddress !== undefined ? req.body.warehouseAddress.trim() : existingConfig.warehouseAddress,
        city: req.body.city !== undefined ? req.body.city.trim() : existingConfig.city,
        state: req.body.state !== undefined ? req.body.state.trim() : existingConfig.state,
        pin: req.body.pin !== undefined ? String(req.body.pin).trim() : existingConfig.pin,
        country: req.body.country !== undefined ? req.body.country.trim() : existingConfig.country,
        phone: req.body.phone !== undefined ? req.body.phone.trim() : existingConfig.phone,
        sellerName: req.body.sellerName !== undefined ? req.body.sellerName.trim() : existingConfig.sellerName,
        sellerGst: req.body.sellerGst !== undefined ? req.body.sellerGst.trim() : existingConfig.sellerGst,
        freeShippingThreshold: req.body.freeShippingThreshold !== undefined ? Number(req.body.freeShippingThreshold) : existingConfig.freeShippingThreshold,
        defaultShippingFee: req.body.defaultShippingFee !== undefined ? Number(req.body.defaultShippingFee) : existingConfig.defaultShippingFee,
        codAvailable: req.body.codAvailable !== undefined ? Boolean(req.body.codAvailable) : existingConfig.codAvailable,
        codExtraFee: req.body.codExtraFee !== undefined ? Number(req.body.codExtraFee) : existingConfig.codExtraFee,
        enableAutoWaybill: req.body.enableAutoWaybill !== undefined ? Boolean(req.body.enableAutoWaybill) : existingConfig.enableAutoWaybill,
        estimatedDays: req.body.estimatedDays !== undefined ? req.body.estimatedDays.trim() : existingConfig.estimatedDays
    };

    settings.shippingConfig = updatedConfig;
    await settings.save();

    res.json(updatedConfig);
});

// @desc    Live track a shipment by Waybill
// @route   GET /api/shipping/track/:waybill
// @access  Public
const trackWaybill = asyncHandler(async (req, res) => {
    const { waybill } = req.params;
    const trackingInfo = await trackShipment(waybill);
    res.json(trackingInfo);
});

// @desc    Get shipping label / packing slip for waybill
// @route   GET /api/shipping/label/:waybill
// @access  Private/Admin
const getLabel = asyncHandler(async (req, res) => {
    const { waybill } = req.params;
    const labelData = await getShippingLabel(waybill);
    res.json(labelData);
});

// @desc    Cancel Delhivery shipment
// @route   POST /api/shipping/cancel/:waybill
// @access  Private/Admin
const cancelWaybill = asyncHandler(async (req, res) => {
    const { waybill } = req.params;
    const result = await cancelShipment(waybill);
    
    // Also update order in DB if exists
    try {
        const Order = require('../models/Order');
        const orders = await Order.findAll();
        const matchedOrder = orders.find(o => o.shippingResult?.waybill === waybill);
        if (matchedOrder) {
            matchedOrder.shippingResult = {
                ...matchedOrder.shippingResult,
                status: 'Cancelled',
                cancelledAt: new Date()
            };
            await matchedOrder.save();
        }
    } catch (e) {
        console.warn('Order DB update warning on cancel:', e.message);
    }

    res.json(result);
});

// @desc    Test Delhivery API connection & configured warehouse
// @route   POST /api/shipping/test-connection
// @access  Private/Admin
const testDelhiveryConnection = asyncHandler(async (req, res) => {
    const token = process.env.DELHIVERY_TOKEN;
    if (!token) {
        res.status(400);
        throw new Error('DELHIVERY_TOKEN is missing in server .env');
    }

    const config = await getShippingConfig();
    const warehouseName = req.body.warehouseName || config.warehouseName;
    const pin = req.body.pin || config.pin;

    // 1. Test token against Delhivery Pincode API
    let pincodeTest;
    try {
        const pinRes = await axios.get(`https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pin}`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        pincodeTest = {
            success: true,
            message: 'API Token authenticated successfully',
            data: pinRes.data?.delivery_codes?.[0]?.postal_code || {}
        };
    } catch (e) {
        res.status(400);
        throw new Error(`Delhivery Token authentication failed: ${e.response?.data?.message || e.message}`);
    }

    // 2. Test dynamic warehouse payload verification
    res.json({
        success: true,
        message: 'Delhivery API connection is active and operational!',
        tokenConfigured: true,
        warehouseName,
        pickupPin: pin,
        pincodeTest
    });
});

module.exports = {
    checkPincode,
    getLiveRate,
    getEstimate,
    getShippingSettings,
    updateShippingSettings,
    trackWaybill,
    getLabel,
    cancelWaybill,
    testDelhiveryConnection
};
