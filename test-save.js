require('dotenv').config();
const { sequelize } = require('./config/db');
const User = require('./models/User');

async function test() {
    await sequelize.authenticate();
    const user = await User.findOne();
    if (!user) { console.log('No user'); return process.exit(0); }
    
    console.log('Old wishlist:', user.wishlist);
    const wishlist = user.wishlist || [];
    wishlist.push('test-id-123');
    user.wishlist = [...wishlist];
    user.changed('wishlist', true);
    await user.save();
    
    const check = await User.findByPk(user.id);
    console.log('New wishlist in DB:', check.wishlist);
    process.exit(0);
}
test();
