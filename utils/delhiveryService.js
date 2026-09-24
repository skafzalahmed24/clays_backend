const axios = require('axios');
const GeneralSetting = require('../models/GeneralSetting');

const BASE_API_URL = process.env.DELHIVERY_API_URL || 'https://track.delhivery.com';

/**
 * Get dynamic shipping & pickup configuration from database
 */
const getShippingConfig = async () => {
    try {
        const settings = await GeneralSetting.getSingleton();
        const config = settings?.shippingConfig || {};
        return {
            provider: config.provider || 'Delhivery',
            warehouseName: config.warehouseName || process.env.DELHIVERY_WAREHOUSE_NAME || 'Primary Warehouse',
            warehouseAddress: config.warehouseAddress || '123 Herbal Garden Road, Green Sector',
            city: config.city || 'Mumbai',
            state: config.state || 'Maharashtra',
            pin: String(config.pin || process.env.DELHIVERY_PICKUP_PIN || '400001'),
            country: config.country || 'India',
            phone: config.phone || '+91 98765 43210',
            sellerName: config.sellerName || settings?.storeName || 'Clarysays',
            sellerGst: config.sellerGst || '',
            freeShippingThreshold: typeof config.freeShippingThreshold === 'number' ? config.freeShippingThreshold : 999,
            defaultShippingFee: typeof config.defaultShippingFee === 'number' ? config.defaultShippingFee : 50,
            codAvailable: config.codAvailable !== false,
            codExtraFee: typeof config.codExtraFee === 'number' ? config.codExtraFee : 0,
            enableAutoWaybill: Boolean(config.enableAutoWaybill),
            estimatedDays: config.estimatedDays || '3 - 5 business days'
        };
    } catch (error) {
        console.error('Error fetching shipping config:', error.message);
        return {
            provider: 'Delhivery',
            warehouseName: process.env.DELHIVERY_WAREHOUSE_NAME || 'Primary Warehouse',
            warehouseAddress: '123 Herbal Garden Road, Green Sector',
            city: 'Mumbai',
            state: 'Maharashtra',
            pin: process.env.DELHIVERY_PICKUP_PIN || '400001',
            country: 'India',
            phone: '+91 98765 43210',
            sellerName: 'Clarysays',
            sellerGst: '',
            freeShippingThreshold: 999,
            defaultShippingFee: 50,
            codAvailable: true,
            codExtraFee: 0,
            enableAutoWaybill: false,
            estimatedDays: '3 - 5 business days'
        };
    }
};

/**
 * Check serviceability for a delivery pincode
 * @param {string|number} pincode
 */
const checkPincodeServiceability = async (pincode) => {
    const cleanPin = String(pincode).trim().replace(/\D/g, '');
    if (!cleanPin || cleanPin.length !== 6) {
        throw new Error('Please enter a valid 6-digit Indian PIN code');
    }

    const token = process.env.DELHIVERY_TOKEN;
    if (!token) {
        throw new Error('Delhivery API token is not configured on server');
    }

    try {
        const response = await axios.get(`${BASE_API_URL}/c/api/pin-codes/json/?filter_codes=${cleanPin}`, {
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const deliveryCodes = response.data?.delivery_codes || [];
        const codeInfo = deliveryCodes.find(item => String(item.postal_code?.pin) === cleanPin);

        if (!codeInfo || !codeInfo.postal_code) {
            return {
                serviceable: false,
                pincode: cleanPin,
                message: 'Delivery is currently unavailable to this PIN code.'
            };
        }

        const pc = codeInfo.postal_code;
        const isPrepaid = pc.pre_paid === 'Y' || pc.cash === 'Y';
        const isCod = pc.cod === 'Y';

        return {
            serviceable: isPrepaid || isCod,
            pincode: cleanPin,
            city: pc.city || pc.district || '',
            state: pc.state_code || '',
            district: pc.district || '',
            cod: isCod,
            prepaid: isPrepaid,
            pickup: pc.pickup === 'Y',
            covidZone: pc.covid_zone || 'Normal',
            isOda: pc.is_oda === 'Y', // Out of delivery area
            estimatedDays: '3 - 5 business days',
            remarks: pc.remarks || ''
        };
    } catch (error) {
        console.error('Delhivery Pincode Check Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to check PIN code serviceability');
    }
};

/**
 * Query Delhivery live rate calculation API for exact freight & COD charges
 */
const calculateDelhiveryLiveRate = async ({ destPincode, weightGrams = 500, paymentMode = 'Prepaid', codAmount = 0 }) => {
    const token = process.env.DELHIVERY_TOKEN;
    if (!token) throw new Error('Delhivery API token is not configured on server');

    const config = await getShippingConfig();
    const originPin = config.pin || '533005';
    const clientName = encodeURIComponent(config.warehouseName || 'CLARYSAYS HERBS B2C');
    const pt = paymentMode === 'COD' ? 'COD' : 'Pre-paid';
    const cod = paymentMode === 'COD' ? Number(codAmount) : 0;

    const url = `${BASE_API_URL}/api/kinko/v1/invoice/charges/.json?md=S&ss=Delivered&d_pin=${destPincode}&o_pin=${originPin}&cgm=${weightGrams}&cl=${clientName}&pt=${pt}${cod ? `&cod=${cod}` : ''}`;

    try {
        const res = await axios.get(url, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const breakdown = res.data?.[0];
        if (!breakdown) throw new Error('No rate breakdown returned by Delhivery');

        const surcharges = (breakdown.charge_PEAK || 0) + (breakdown.charge_DPH || 0) + (breakdown.charge_FS || 0);
        const freightCharge = breakdown.charge_DL || 0;
        const codCharge = breakdown.charge_COD || 0;
        const taxableSubtotal = freightCharge + codCharge + surcharges;
        const cgst = breakdown.tax_data?.CGST || 0;
        const sgst = breakdown.tax_data?.SGST || 0;
        const igst = breakdown.tax_data?.IGST || 0;
        const taxAmount = cgst + sgst + igst;
        const totalAmount = breakdown.total_amount || (taxableSubtotal + taxAmount);

        return {
            totalAmount: Math.round(totalAmount * 100) / 100,
            freightCharge: Math.round(freightCharge * 100) / 100,
            codCharge: Math.round(codCharge * 100) / 100,
            surcharges: Math.round(surcharges * 100) / 100,
            peakCharge: Math.round((breakdown.charge_PEAK || 0) * 100) / 100,
            handlingCharge: Math.round((breakdown.charge_DPH || 0) * 100) / 100,
            fuelSurcharge: Math.round((breakdown.charge_FS || 0) * 100) / 100,
            taxableSubtotal: Math.round(taxableSubtotal * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            cgst: Math.round(cgst * 100) / 100,
            sgst: Math.round(sgst * 100) / 100,
            igst: Math.round(igst * 100) / 100,
            zone: breakdown.zone || 'Domestic',
            chargedWeight: breakdown.charged_weight || weightGrams,
            originPin,
            destPin: destPincode,
            paymentMode: pt,
            codAmount: cod,
            raw: breakdown
        };
    } catch (e) {
        console.warn('Delhivery Live Rate API Error:', e.response?.data || e.message);
        throw new Error(e.response?.data?.message || e.message || 'Failed to calculate live Delhivery rate');
    }
};

/**
 * Calculate dynamic shipping estimate and fees
 */
const calculateShippingEstimate = async ({ pincode, subtotal = 0, paymentMethod = 'Prepaid', weightGrams = 500, codAmount = 0 }) => {
    const config = await getShippingConfig();
    let serviceability = null;
    let liveCost = null;

    if (pincode && String(pincode).trim().length === 6) {
        try {
            serviceability = await checkPincodeServiceability(pincode);
        } catch (e) {
            console.warn('Serviceability lookup warning:', e.message);
        }

        try {
            liveCost = await calculateDelhiveryLiveRate({
                destPincode: pincode,
                weightGrams,
                paymentMode: paymentMethod,
                codAmount
            });
        } catch (e) {
            // Fallback to static rule
        }
    }

    const isFreeShipping = Number(subtotal) >= Number(config.freeShippingThreshold);
    let shippingFee = isFreeShipping ? 0 : Number(config.defaultShippingFee);
    
    let codFee = 0;
    if (paymentMethod === 'COD' && config.codAvailable) {
        codFee = Number(config.codExtraFee) || 0;
    }

    const totalShippingFee = shippingFee + codFee;

    return {
        serviceable: serviceability ? serviceability.serviceable : true,
        codAllowed: serviceability ? (serviceability.cod && config.codAvailable) : config.codAvailable,
        prepaidAllowed: serviceability ? serviceability.prepaid : true,
        shippingFee: totalShippingFee,
        baseShippingFee: shippingFee,
        codFee,
        isFreeShipping,
        freeShippingThreshold: config.freeShippingThreshold,
        estimatedDays: config.estimatedDays,
        city: serviceability?.city || '',
        state: serviceability?.state || '',
        liveCost,
        warehouse: {
            city: config.city,
            state: config.state
        }
    };
};

/**
 * Create a live shipment and generate Waybill / AWB in Delhivery
 * @param {Object} order - The Sequelize Order object (populated with User)
 * @returns {Object} - Delhivery API response
 */
const createShipment = async (order) => {
    const token = process.env.DELHIVERY_TOKEN;
    if (!token) {
        throw new Error('Delhivery API token is not configured on server');
    }

    const config = await getShippingConfig();
    const paymentMode = order.paymentMethod === 'COD' ? 'COD' : 'Prepaid';

    // Calculate total quantity and weight (default 0.5kg per product if not specified)
    const items = order.orderItems || [];
    const totalQty = items.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);
    const totalWeight = Math.max(0.5, totalQty * 0.4);

    const customerAddress = order.shippingAddress || {};
    const customerPhone = customerAddress.phone || order.user?.addresses?.[0]?.phone || '9999999999';
    const customerName = (customerAddress.firstName ? `${customerAddress.firstName} ${customerAddress.lastName || ''}`.trim() : null) || 
                         order.user?.name || 'Customer';

    const orderNumberStr = order.orderNumber ? `ORD-${order.orderNumber}` : `ORD-${order.id.substring(0, 8)}`;

    const pickupLocation = {
        name: config.warehouseName,
        add: config.warehouseAddress,
        city: config.city,
        pin: String(config.pin),
        country: config.country || 'India',
        phone: config.phone
    };

    const payloadData = {
        shipments: [
            {
                name: customerName,
                add: customerAddress.address + (customerAddress.apartment ? `, ${customerAddress.apartment}` : ''),
                city: customerAddress.city,
                state: customerAddress.state || 'Maharashtra',
                pin: String(customerAddress.postalCode),
                country: customerAddress.country || 'India',
                phone: customerPhone,
                order: orderNumberStr,
                payment_mode: paymentMode,
                return_pin: String(config.pin),
                return_city: config.city,
                return_phone: config.phone,
                return_add: config.warehouseAddress,
                return_state: config.state,
                return_country: config.country || 'India',
                package_desc: `Order ${orderNumberStr} - ${items.map(i => i.name).slice(0, 2).join(', ')}`,
                package_type: paymentMode,
                weight: totalWeight,
                breadth: 12,
                length: 15,
                height: 10,
                quantity: totalQty,
                gst_amount: Number(order.taxPrice) || 0,
                seller_name: config.sellerName,
                seller_add: config.warehouseAddress,
                seller_city: config.city,
                seller_inv_rev: 'No',
                seller_gst_tin: config.sellerGst || '',
                cod_amount: paymentMode === 'COD' ? Number(order.totalPrice) : 0,
                total_amount: Number(order.totalPrice)
            }
        ],
        pickup_location: pickupLocation
    };

    const params = new URLSearchParams();
    params.append('format', 'json');
    params.append('data', JSON.stringify(payloadData));

    try {
        const response = await axios.post(
            `${BASE_API_URL}/api/cmu/create.json`,
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Token ${token}`
                }
            }
        );

        const data = response.data;
        if (data.error || data.success === false || (data.packages && data.packages[0] && data.packages[0].status === 'Fail')) {
            let errorReason = data.rmk || 'Delhivery shipment creation rejected';
            
            const pkgRemark = data.packages?.[0]?.remarks?.[0] || '';
            if (pkgRemark.includes('insufficient balance')) {
                errorReason = 'Insufficient balance in your Delhivery One wallet. Please recharge your shipping wallet on the Delhivery One dashboard.';
            } else if (pkgRemark.includes('ClientWarehouse matching query does not exist') || errorReason.includes('ClientWarehouse')) {
                errorReason = 'The pickup facility name does not match your registered Delhivery warehouse. Please verify Settings > Shipping.';
            } else if (pkgRemark) {
                errorReason = pkgRemark;
            }

            throw new Error(`Delhivery Error: ${errorReason}`);
        }

        return data;
    } catch (error) {
        console.error('Delhivery Shipment Creation Error:', error.response?.data || error.message);
        
        let errorMsg = error.message || 'Failed to create Delhivery shipment';
        if (error.response?.data) {
            const rawData = error.response.data;
            if (typeof rawData === 'string') {
                errorMsg = rawData;
            } else if (rawData.packages?.[0]?.remarks?.[0]) {
                const rmk = rawData.packages[0].remarks[0];
                if (rmk.includes('insufficient balance')) {
                    errorMsg = 'Insufficient balance in your Delhivery One wallet. Please recharge your wallet on Delhivery One dashboard.';
                } else {
                    errorMsg = rmk;
                }
            } else if (rawData.rmk) {
                errorMsg = rawData.rmk;
            }
        }
        throw new Error(errorMsg);
    }
};

/**
 * Track a shipment by Waybill / AWB number
 * @param {string} waybill
 */
const trackShipment = async (waybill) => {
    if (!waybill) {
        throw new Error('Waybill number is required for tracking');
    }

    const token = process.env.DELHIVERY_TOKEN;
    if (!token) {
        throw new Error('Delhivery API token is not configured on server');
    }

    try {
        const response = await axios.get(`${BASE_API_URL}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`, {
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        const data = response.data;
        const shipmentData = data?.ShipmentData?.[0]?.Shipment || null;

        if (!shipmentData) {
            return {
                found: false,
                waybill,
                status: 'Manifested / Ready for Pickup',
                scans: [],
                raw: data
            };
        }

        const scans = (shipmentData.Scans || []).map(scan => ({
            dateTime: scan.ScanDetail?.ScanDateTime,
            status: scan.ScanDetail?.Scan,
            location: scan.ScanDetail?.ScannedLocation,
            instructions: scan.ScanDetail?.Instructions,
            statusCode: scan.ScanDetail?.StatusCode
        }));

        return {
            found: true,
            waybill: shipmentData.AWB || waybill,
            status: shipmentData.Status?.Status || 'In Transit',
            statusType: shipmentData.Status?.StatusType || '',
            statusDateTime: shipmentData.Status?.StatusDateTime,
            statusLocation: shipmentData.Status?.StatusLocation,
            origin: shipmentData.Origin,
            destination: shipmentData.Destination,
            consignee: shipmentData.Consignee?.Name,
            expectedDate: shipmentData.ExpectedDeliveryDate,
            scans
        };
    } catch (error) {
        console.error('Delhivery Tracking Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch tracking details from Delhivery');
    }
};

/**
 * Fetch printable shipping label / packing slip
 * @param {string} waybill
 */
const getShippingLabel = async (waybill) => {
    if (!waybill) {
        throw new Error('Waybill number is required to generate packing slip');
    }

    const token = process.env.DELHIVERY_TOKEN;
    if (!token) {
        throw new Error('Delhivery API token is not configured on server');
    }

    try {
        const response = await axios.get(`${BASE_API_URL}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&pdf=true`, {
            headers: {
                'Authorization': `Token ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Delhivery Packing Slip Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to generate shipping label from Delhivery');
    }
};

/**
 * Cancel an active shipment waybill
 * @param {string} waybill
 */
const cancelShipment = async (waybill) => {
    if (!waybill) {
        throw new Error('Waybill number is required for cancellation');
    }

    const token = process.env.DELHIVERY_TOKEN;
    if (!token) {
        throw new Error('Delhivery API token is not configured on server');
    }

    try {
        const payload = {
            waybill: String(waybill),
            cancellation: 'true'
        };

        const response = await axios.post(`${BASE_API_URL}/api/p/edit`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Delhivery Cancel Shipment Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to cancel shipment on Delhivery');
    }
};

module.exports = {
    getShippingConfig,
    checkPincodeServiceability,
    calculateShippingEstimate,
    calculateDelhiveryLiveRate,
    createShipment,
    trackShipment,
    getShippingLabel,
    cancelShipment
};
