'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const attributesTable = await queryInterface.describeTable('Attributes');
      if (!attributesTable.bannerImage) {
        await queryInterface.addColumn('Attributes', 'bannerImage', {
          type: Sequelize.STRING,
          allowNull: true
        });
      }
    } catch (e) {
      console.warn('Migration warning (Attributes.bannerImage):', e.message);
    }
  },

  down: async (queryInterface) => {
    try {
      const attributesTable = await queryInterface.describeTable('Attributes');
      if (attributesTable.bannerImage) {
        await queryInterface.removeColumn('Attributes', 'bannerImage');
      }
    } catch (e) {
      console.warn('Rollback warning (Attributes.bannerImage):', e.message);
    }
  }
};
