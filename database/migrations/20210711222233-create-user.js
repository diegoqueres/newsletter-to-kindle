'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING(128)
      },
      salt: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      super: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      pendingPassword: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      pendingConfirm: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      confirmCode: {
        allowNull: true,
        type: Sequelize.SMALLINT       
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

    await queryInterface.addColumn('Feeds', 'userId', {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    //removing foreign keys
    await queryInterface.removeColumn('Feeds', 'userId');
    
    await queryInterface.dropTable('Users');
  }
};