'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      level: {
        type: Sequelize.STRING(15) 
      },
      message: {
        type: Sequelize.STRING(1024) 
      },
      meta: {
        type: Sequelize.STRING
      },            
      timestamp: {
        type: Sequelize.DATE
      },    
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Logs');
  }
};