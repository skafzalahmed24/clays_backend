'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.createTable('GoldStandards', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING,
          defaultValue: 'The Gold Standard'
        },
        subtitle: {
          type: Sequelize.STRING,
          defaultValue: ''
        },
        description: {
          type: Sequelize.TEXT,
          defaultValue: 'Experience the pinnacle of luxury skincare. Our signature serum is infused with pure 24k gold flakes, known since ancient times for its powerful anti-aging and illuminating properties.'
        },
        description2: {
          type: Sequelize.TEXT,
          defaultValue: 'Combined with ultra-hydrating hyaluronic acid and rare botanical extracts, it penetrates deep to restore your skin\'s natural elasticity, leaving you with an unmistakable, radiant glow.'
        },
        image: {
          type: Sequelize.STRING,
          defaultValue: '/assets/gold_standard.png'
        },
        link: {
          type: Sequelize.STRING,
          defaultValue: '/shop'
        },
        linkText: {
          type: Sequelize.STRING,
          defaultValue: 'Discover The Formula'
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
      console.warn('Migration warning (GoldStandards table):', e.message);
    }
  },

  down: async (queryInterface) => {
    try {
      await queryInterface.dropTable('GoldStandards');
    } catch (e) {
      console.warn('Rollback warning (GoldStandards table):', e.message);
    }
  }
};

