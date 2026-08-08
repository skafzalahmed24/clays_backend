require('dotenv').config();
const HeroSlide = require('./models/HeroSlide');
const { connectDB, sequelize } = require('./config/db');

async function run() {
    try {
        await sequelize.authenticate();
        
        // Find the first slide or a specific slide to update
        const slide = await HeroSlide.findOne({ order: [['order', 'ASC']] });
        
        if (slide) {
            slide.mobileMedia = '/uploads/mobile_banner_demo.png';
            await slide.save();
            console.log('Successfully updated mobile banner for slide:', slide.title);
        } else {
            console.log('No hero slides found to update.');
        }
    } catch (e) {
        console.error(e.message);
    } finally {
        process.exit();
    }
}
run();
