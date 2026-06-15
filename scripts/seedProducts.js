require('dotenv').config();
const { sequelize } = require('../config/db');
const Product = require('../models/Product');
const Attribute = require('../models/Attribute');
const User = require('../models/User');

const seedProducts = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const admin = await User.findOne();
        if (!admin) {
            console.log('No user found to associate products. Please create one first.');
            process.exit(1);
        }

        const subCategories = await Attribute.findAll({ where: { type: 'subCategories' } });
        
        if (!subCategories || subCategories.length === 0) {
            console.log('No subcategories found in Attributes table.');
            process.exit(1);
        }

        let createdCount = 0;
        console.log(`Found ${subCategories.length} subcategories. Generating 5 products for each...`);

        for (const sub of subCategories) {
            for (let i = 1; i <= 5; i++) {
                await Product.create({
                    userId: admin.id,
                    name: `Sample ${sub.name} Product ${i}`,
                    description: `This is a sample description for ${sub.name} product ${i}. Crafted with premium herbal ingredients to give you the best experience.`,
                    price: 1500 + (i * 100),
                    originalPrice: 2000 + (i * 100),
                    category: sub.value, // parent category name
                    subCategory: sub.name,
                    img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60', // Placeholder cosmetics image
                    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'],
                    stock: 50,
                    isFeatured: true 
                });
                createdCount++;
            }
        }

        console.log(`Successfully created ${createdCount} products!`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();
