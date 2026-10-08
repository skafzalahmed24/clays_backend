'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding to prevent errors
    const tableInfo = await queryInterface.describeTable('Users');
    if (!tableInfo.phone) {
      await queryInterface.addColumn('Users', 'phone', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('Users');
    if (tableInfo.phone) {
      await queryInterface.removeColumn('Users', 'phone');
    }
  }
};
