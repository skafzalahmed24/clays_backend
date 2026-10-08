require('dotenv').config();
const { sequelize } = require('../config/db');

async function fix() {
    try {
        await sequelize.authenticate();
        console.log('====================================================');
        console.log('🚀 RUNNING COMPREHENSIVE DATABASE SCHEMA FIX');
        console.log('====================================================\n');

        // 1. Orders table -> orderNumber (Auto-increment integer with sequence)
        console.log('1. Checking "Orders"."orderNumber"...');
        await sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "Orders_orderNumber_seq";`);
        await sequelize.query(`
            ALTER TABLE "Orders" 
            ADD COLUMN IF NOT EXISTS "orderNumber" INTEGER DEFAULT nextval('"Orders_orderNumber_seq"');
        `);
        // Backfill nulls if any exist
        await sequelize.query(`
            UPDATE "Orders" 
            SET "orderNumber" = nextval('"Orders_orderNumber_seq"') 
            WHERE "orderNumber" IS NULL;
        `);
        try {
            await sequelize.query(`ALTER SEQUENCE "Orders_orderNumber_seq" OWNED BY "Orders"."orderNumber";`);
        } catch (seqErr) {
            // Non-critical if already owned
        }
        await sequelize.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "Orders_orderNumber_unique" 
            ON "Orders" ("orderNumber");
        `);
        console.log('✓ "Orders"."orderNumber" configured.');

        // 2. Orders table -> shippingResult (JSONB)
        console.log('2. Checking "Orders"."shippingResult"...');
        await sequelize.query(`
            ALTER TABLE "Orders" 
            ADD COLUMN IF NOT EXISTS "shippingResult" JSONB;
        `);
        console.log('✓ "Orders"."shippingResult" configured.');

        // 3. GeneralSettings table -> shippingConfig (JSONB)
        console.log('3. Checking "GeneralSettings"."shippingConfig"...');
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
        console.log('✓ "GeneralSettings"."shippingConfig" configured.');

        // 4. HeroSlides table -> mobileMedia (VARCHAR)
        console.log('4. Checking "HeroSlides"."mobileMedia"...');
        await sequelize.query(`
            ALTER TABLE "HeroSlides" 
            ADD COLUMN IF NOT EXISTS "mobileMedia" VARCHAR(255);
        `);
        console.log('✓ "HeroSlides"."mobileMedia" configured.');

        // 5. Users table -> phone (VARCHAR)
        console.log('5. Checking "Users"."phone"...');
        await sequelize.query(`
            ALTER TABLE "Users" 
            ADD COLUMN IF NOT EXISTS "phone" VARCHAR(255);
        `);
        console.log('✓ "Users"."phone" configured.');

        console.log('\n====================================================');
        console.log('🎉 ALL DATABASE COLUMNS CHECKED & SYNCED SUCCESSFULLY!');
        console.log('====================================================\n');
    } catch (e) {
        console.error('❌ Error applying schema fixes:', e);
    } finally {
        process.exit(0);
    }
}

fix();
