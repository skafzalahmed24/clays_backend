require('dotenv').config();
const { sequelize } = require('./config/db');

async function run() {
    try {
        await sequelize.authenticate();
        await sequelize.query('ALTER TABLE "HeroSlides" ADD COLUMN "mobileMedia" VARCHAR(255);');
        console.log("Column added successfully!");
    } catch (e) {
        console.error(e.message);
    } finally {
        process.exit();
    }
}
run();
