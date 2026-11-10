'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const table = await queryInterface.describeTable('Heritages');
      if (!table.description2) {
        await queryInterface.addColumn('Heritages', 'description2', {
          type: Sequelize.TEXT,
          allowNull: true,
          defaultValue: ''
        });
      }
      if (!table.linkText) {
        await queryInterface.addColumn('Heritages', 'linkText', {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: 'Read Our Story'
        });
      }
    } catch (e) {
      console.warn('Migration warning (Heritages add columns):', e.message);
    }
  },

  down: async (queryInterface) => {
    try {
      const table = await queryInterface.describeTable('Heritages');
      if (table.description2) {
        await queryInterface.removeColumn('Heritages', 'description2');
      }
    } catch (e) {
      console.warn('Rollback warning (Heritages):', e.message);
    }
  }
};

