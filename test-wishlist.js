const { sequelize } = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
require('dotenv').config();

async function test() {
    try {
        const user = await User.findOne();
        if (!user) return console.log('No user');
        const product = await Product.findOne();
        if (!product) return console.log('No product');
        
        console.log('User:', user.id);
        console.log('Product:', product.id);
        
        // Add to wishlist
        let wishlist = user.wishlist || [];
        if (!wishlist.includes(product.id)) {
            wishlist.push(product.id);
            user.wishlist = wishlist;
            user.changed('wishlist', true);
            await user.save();
        }
        
        // Populate
        const products = await Product.findAll({ where: { id: user.wishlist } });
        console.log('Wishlist products:', products.length);
        console.log('Products:', products.map(p => p.id));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
