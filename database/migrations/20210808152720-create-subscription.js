'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Subscriptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      subscriberId: {
          type: Sequelize.INTEGER,
          foreignKey: true,
          references: {
            model: 'Subscribers', 
            key: 'id'
          }
      },
      newsletterId: {
        type: Sequelize.INTEGER,
        foreignKey: true,
        references: {
          model: 'Newsletters', 
          key: 'id'
        }
      },
      acceptedTerms: {
        type: Sequelize.BOOLEAN
      },
      token: {
        type: Sequelize.STRING
      },
      pendingConfirm: {
        allowNull: false,
        defaultValue: true,
        type: Sequelize.BOOLEAN
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

    await queryInterface.addConstraint('Subscriptions', {
      fields: ['subscriberId', 'newsletterId'],
      type: 'unique',
      name: 'constraint_subscriberxnewsletter'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Subscriptions');
  }
};