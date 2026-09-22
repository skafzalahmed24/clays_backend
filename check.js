require('dotenv').config();
const { Order, User } = require('./models');
const { connectDB } = require('./config/db');

async function run() {
    await connectDB();
    const order = await Order.findOne({ order: [['createdAt', 'DESC']], include: ['user'] });
    console.log(JSON.stringify(order, null, 2));
    process.exit(0);
}
run();
