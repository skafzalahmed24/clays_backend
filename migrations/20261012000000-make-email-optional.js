'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('Users', 'email', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });
    } catch (err) {
      // Fallback direct SQL query
      await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "email" DROP NOT NULL;');
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('Users', 'email', {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      });
    } catch (err) {
      await queryInterface.sequelize.query('ALTER TABLE "Users" ALTER COLUMN "email" SET NOT NULL;');
    }
  }
};
