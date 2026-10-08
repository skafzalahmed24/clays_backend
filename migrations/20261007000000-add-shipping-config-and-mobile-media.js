'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Orders.orderNumber & Orders.shippingResult
    try {
      const ordersTable = await queryInterface.describeTable('Orders');
      
      if (!ordersTable.orderNumber) {
        await queryInterface.sequelize.query(`CREATE SEQUENCE IF NOT EXISTS "Orders_orderNumber_seq";`);
        await queryInterface.sequelize.query(`
          ALTER TABLE "Orders" 
          ADD COLUMN IF NOT EXISTS "orderNumber" INTEGER DEFAULT nextval('"Orders_orderNumber_seq"');
        `);
        await queryInterface.sequelize.query(`
          UPDATE "Orders" 
          SET "orderNumber" = nextval('"Orders_orderNumber_seq"') 
          WHERE "orderNumber" IS NULL;
        `);
        await queryInterface.sequelize.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS "Orders_orderNumber_unique" 
          ON "Orders" ("orderNumber");
        `);
      }

      if (!ordersTable.shippingResult) {
        await queryInterface.addColumn('Orders', 'shippingResult', {
          type: Sequelize.JSONB,
          allowNull: true
        });
      }
    } catch (e) {
      console.warn('Migration warning (Orders):', e.message);
    }

    // 2. GeneralSettings.shippingConfig
    try {
      const generalSettingsTable = await queryInterface.describeTable('GeneralSettings');
      if (!generalSettingsTable.shippingConfig) {
        await queryInterface.addColumn('GeneralSettings', 'shippingConfig', {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {
            provider: 'Delhivery',
            warehouseName: 'Primary Warehouse',
            warehouseAddress: '123 Herbal Garden Road, Green Sector',
            city: 'Mumbai',
            state: 'Maharashtra',
            pin: '400001',
            country: 'India',
            phone: '+91 98765 43210',
            sellerName: 'Clarysays',
            sellerGst: '',
            freeShippingThreshold: 999,
            defaultShippingFee: 50,
            codAvailable: true,
            codExtraFee: 0,
            enableAutoWaybill: false,
            estimatedDays: '3 - 5 business days'
          }
        });
      }
    } catch (e) {
      console.warn('Migration warning (GeneralSettings.shippingConfig):', e.message);
    }

    // 3. HeroSlides.mobileMedia
    try {
      const heroSlidesTable = await queryInterface.describeTable('HeroSlides');
      if (!heroSlidesTable.mobileMedia) {
        await queryInterface.addColumn('HeroSlides', 'mobileMedia', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
    } catch (e) {
      console.warn('Migration warning (HeroSlides.mobileMedia):', e.message);
    }

    // 4. Users.phone
    try {
      const usersTable = await queryInterface.describeTable('Users');
      if (!usersTable.phone) {
        await queryInterface.addColumn('Users', 'phone', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
    } catch (e) {
      console.warn('Migration warning (Users.phone):', e.message);
    }
  },

  down: async (queryInterface) => {
    try {
      const ordersTable = await queryInterface.describeTable('Orders');
      if (ordersTable.orderNumber) {
        await queryInterface.removeColumn('Orders', 'orderNumber');
      }
      if (ordersTable.shippingResult) {
        await queryInterface.removeColumn('Orders', 'shippingResult');
      }
    } catch (e) {
      console.warn('Rollback warning (Orders):', e.message);
    }

    try {
      const generalSettingsTable = await queryInterface.describeTable('GeneralSettings');
      if (generalSettingsTable.shippingConfig) {
        await queryInterface.removeColumn('GeneralSettings', 'shippingConfig');
      }
    } catch (e) {
      console.warn('Rollback warning (GeneralSettings.shippingConfig):', e.message);
    }

    try {
      const heroSlidesTable = await queryInterface.describeTable('HeroSlides');
      if (heroSlidesTable.mobileMedia) {
        await queryInterface.removeColumn('HeroSlides', 'mobileMedia');
      }
    } catch (e) {
      console.warn('Rollback warning (HeroSlides.mobileMedia):', e.message);
    }
  }
};
