require('dotenv').config();
const { sequelize } = require('../config/db');

async function syncPhoneColumn() {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Add phone column to Users table if not exists
        await sequelize.query(`
            ALTER TABLE "Users" 
            ADD COLUMN IF NOT EXISTS "phone" VARCHAR(255);
        `);

        console.log('Column "phone" added/verified in "Users" table successfully.');

        const [cols] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Users';
        `);
        console.log('Users table columns:', cols.map(c => c.column_name));

    } catch (error) {
        console.warn('Note: Database sync error (Postgres may not be currently running locally):', error.message);
    } finally {
        process.exit(0);
    }
}

syncPhoneColumn();
