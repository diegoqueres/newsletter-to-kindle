'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Subscriptions', {
        SubscriberId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'Subscribers', 
            key: 'id'
          }
        },
        FeedId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          references: {
            model: 'Feeds', 
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