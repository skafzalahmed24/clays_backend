const { sequelize } = require('./config/db');
const User = require('./models/User');
require('dotenv').config(); // Ensure DB URL is loaded

async function run() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['email', 'wishlist'] });
        console.log(users.map(u => ({ email: u.email, wishlist: u.wishlist })));
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
