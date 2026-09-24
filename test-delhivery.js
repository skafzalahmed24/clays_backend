const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from local .env
dotenv.config();

const testDelhivery = async () => {
    try {
        const payloadData = {
            shipments: [
                {
                    name: 'Test Customer',
                    add: '123 Test Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pin: '400001',
                    country: 'India',
                    phone: '9999999999',
                    order: `TEST_${Date.now()}`,
                    payment_mode: 'Prepaid',
                    return_pin: '400001',
                    return_city: 'Mumbai',
                    return_phone: '9999999999',
                    return_add: '123 Test Street',
                    return_state: 'Maharashtra',
                    return_country: 'India',
                    package_desc: `Test Order`,
                    package_type: 'Prepaid',
                    weight: 0.5,
                    breadth: 10,
                    length: 10,
                    height: 10,
                    quantity: 1,
                    gst_amount: 0,
                    seller_name: 'Clay Ecommerce', 
                    seller_add: 'Placeholder Warehouse Address', 
                    seller_city: 'Mumbai', 
                    seller_inv_rev: 'No',
                    cod_amount: 0
                }
            ],
            pickup_location: {
                name: 'Clay Ecommerce', 
                add: 'Placeholder Warehouse Address', 
                city: 'Mumbai', 
                pin: '400001', 
                country: 'India', 
                phone: '9999999999' 
            }
        };

        const params = new URLSearchParams();
        params.append('format', 'json');
        params.append('data', JSON.stringify(payloadData));

        console.log('Sending request to Delhivery...');
        const response = await axios.post(
            'https://track.delhivery.com/api/cmu/create.json',
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`
                }
            }
        );

        console.log('Success:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error Response Data:', JSON.stringify(error.response?.data, null, 2));
    }
};

testDelhivery();
