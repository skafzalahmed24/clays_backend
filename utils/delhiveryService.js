const axios = require('axios');

/**
 * Create a shipment in Delhivery
 * @param {Object} order - The Sequelize Order object (populated with User)
 * @returns {Object} - Delhivery API response
 */
const createShipment = async (order) => {
    try {
        const paymentMode = order.paymentMethod === 'COD' ? 'COD' : 'Prepaid';
        
        const payloadData = {
            shipments: [
                {
                    name: order.user ? order.user.name : 'Guest Customer',
                    add: order.shippingAddress.address,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state || 'Unknown',
                    pin: order.shippingAddress.postalCode,
                    country: order.shippingAddress.country || 'India',
                    phone: order.shippingAddress.phone || '9999999999',
                    order: `${order.orderNumber}`,
                    payment_mode: paymentMode,
                    return_pin: order.shippingAddress.postalCode,
                    return_city: order.shippingAddress.city,
                    return_phone: order.shippingAddress.phone || '9999999999',
                    return_add: order.shippingAddress.address,
                    return_state: order.shippingAddress.state || 'Unknown',
                    return_country: order.shippingAddress.country || 'India',
                    package_desc: `Order #${order.orderNumber} from Clay Ecommerce`,
                    package_type: paymentMode,
                    weight: 0.5,
                    breadth: 10,
                    length: 10,
                    height: 10,
                    quantity: order.orderItems.reduce((acc, item) => acc + item.qty, 0),
                    gst_amount: order.taxPrice || 0,
                    seller_name: 'Clay Ecommerce', // Placeholder
                    seller_add: 'Placeholder Warehouse Address', // Placeholder
                    seller_city: 'Mumbai', // Placeholder
                    seller_inv_rev: 'No',
                    cod_amount: paymentMode === 'COD' ? order.totalPrice : 0
                }
            ],
            pickup_location: {
                name: 'Clay Ecommerce', // Placeholder
                add: 'Placeholder Warehouse Address', // Placeholder
                city: 'Mumbai', // Placeholder
                pin: '400001', // Placeholder
                country: 'India', // Placeholder
                phone: '9999999999' // Placeholder
            }
        };

        const params = new URLSearchParams();
        params.append('format', 'json');
        params.append('data', JSON.stringify(payloadData));

        const apiUrl = process.env.DELHIVERY_API_URL || 'https://track.delhivery.com/api/cmu/create.json';

        const response = await axios.post(
            apiUrl,
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('Delhivery Shipment Creation Error:', error.response?.data || error.message);
        
        let errorMsg = 'Failed to create Delhivery shipment';
        if (error.response?.data) {
            if (typeof error.response.data === 'string') {
                errorMsg = error.response.data;
            } else {
                errorMsg = JSON.stringify(error.response.data);
            }
        }
        throw new Error(errorMsg);
    }
};

module.exports = {
    createShipment
};
