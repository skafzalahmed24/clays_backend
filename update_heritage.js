require('dotenv').config();
const Heritage = require('./models/Heritage');
const { connectDB, sequelize } = require('./config/db');

async function run() {
    try {
        await sequelize.authenticate();
        
        let heritage = await Heritage.findOne();
        if (!heritage) {
            // If it doesn't exist, create it
            heritage = await Heritage.create({
                title: 'Mastery in Every Cut',
                subtitle: 'Since 1985',
                description: 'Our heritage is built on a foundation of uncompromised quality and artistic vision.',
                link: '/about',
                linkText: 'Read Our Story'
            });
        }
        
        heritage.image = '/uploads/mastery_in_every_cut.png';
        await heritage.save();
        
        console.log('Successfully updated Heritage section with new image.');
    } catch (e) {
        console.error(e.message);
    } finally {
        process.exit();
    }
}
run();
