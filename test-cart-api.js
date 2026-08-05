const { sequelize } = require('./config/db');
require('dotenv').config();

async function test() {
    try {
        const email = `test-${Date.now()}@test.com`;
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test', email: email, password: 'password' })
        });
        const regData = await regRes.json();
        const token = regData.data.token;
        
        const prodRes = await fetch('http://localhost:5000/api/products');
        const prodData = await prodRes.json();
        const product = prodData.data.products[0];
        
        const addRes = await fetch('http://localhost:5000/api/users/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ productId: product.id, qty: 1 })
        });
        const addData = await addRes.json();
        
        console.log('--- ADD RESPONSE DATA ---');
        console.log(JSON.stringify(addData, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
