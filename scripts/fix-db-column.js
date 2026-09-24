require('dotenv').config();
const { sequelize } = require('../config/db');

async function fix() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Check all tables
        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log('Tables:', tables.map(t => t.table_name));

        // 2. Add column shippingConfig safely with quotes to GeneralSettings table
        await sequelize.query(`
            ALTER TABLE "GeneralSettings" 
            ADD COLUMN IF NOT EXISTS "shippingConfig" JSONB DEFAULT '{
                "provider": "Delhivery",
                "warehouseName": "Primary Warehouse",
                "warehouseAddress": "123 Herbal Garden Road, Green Sector",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pin": "400001",
                "country": "India",
                "phone": "+91 98765 43210",
                "sellerName": "Clarysays",
                "sellerGst": "",
                "freeShippingThreshold": 999,
                "defaultShippingFee": 50,
                "codAvailable": true,
                "codExtraFee": 0,
                "enableAutoWaybill": false,
                "estimatedDays": "3 - 5 business days"
            }'::jsonb;
        `);

        console.log('Column "shippingConfig" added to "GeneralSettings" successfully!');

        // 3. Verify columns
        const [cols] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'GeneralSettings';
        `);
        console.log('GeneralSettings Columns:', cols.map(c => c.column_name));

    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}

fix();
