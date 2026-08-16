require('dotenv').config();
const { sequelize } = require('./config/db');
const Order = require('./models/Order');

async function syncOrder() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');
        await Order.sync({ alter: true });
        console.log('Order model synced successfully');
        process.exit(0);
    } catch (error) {
        console.error('Failed to sync Order model:', error);
        process.exit(1);
    }
}

syncOrder();
