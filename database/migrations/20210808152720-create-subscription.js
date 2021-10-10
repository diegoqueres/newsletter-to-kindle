'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Subscriptions', {
        subscriberId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'Subscribers', 
            key: 'id'
          }
        },
        newsletterId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'Newsletters', 
            key: 'id'
          }
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Subscriptions');
  }
};