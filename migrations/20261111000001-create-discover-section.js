'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('DiscoverSections', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        badge: {
          type: Sequelize.STRING,
          defaultValue: 'Elevate Your Ritual'
        },
        title: {
          type: Sequelize.STRING,
          defaultValue: 'Discover Your'
        },
        highlightText: {
          type: Sequelize.STRING,
          defaultValue: 'Ultimate Glow'
        },
        description: {
          type: Sequelize.TEXT
        },
        link: {
          type: Sequelize.STRING,
          defaultValue: '/shop'
        },
        linkText: {
          type: Sequelize.STRING,
          defaultValue: 'Shop The Ritual'
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
      console.warn('Migration warning (DiscoverSections):', e.message);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.dropTable('DiscoverSections');
    } catch (e) {
      console.warn('Rollback warning (DiscoverSections):', e.message);
    }
  }
};

