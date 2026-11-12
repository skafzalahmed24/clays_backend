'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('OurVisions', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING,
          defaultValue: 'Our Vision'
        },
        description: {
          type: Sequelize.TEXT
        },
        item1Title: {
          type: Sequelize.STRING,
          defaultValue: 'Clean Ingredients'
        },
        item1Description: {
          type: Sequelize.TEXT
        },
        item1Icon: {
          type: Sequelize.STRING,
          defaultValue: 'sparkles'
        },
        item2Title: {
          type: Sequelize.STRING,
          defaultValue: 'Cruelty-Free'
        },
        item2Description: {
          type: Sequelize.TEXT
        },
        item2Icon: {
          type: Sequelize.STRING,
          defaultValue: 'heart'
        },
        item3Title: {
          type: Sequelize.STRING,
          defaultValue: 'Dermatologist Tested'
        },
        item3Description: {
          type: Sequelize.TEXT
        },
        item3Icon: {
          type: Sequelize.STRING,
          defaultValue: 'shield'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
    } catch (e) {
      console.warn('Migration warning (OurVisions):', e.message);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.dropTable('OurVisions');
    } catch (e) {
      console.warn('Rollback warning (OurVisions):', e.message);
    }
  }
};

