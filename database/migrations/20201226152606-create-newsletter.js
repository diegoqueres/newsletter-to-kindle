'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Newsletters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      feedUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      author: {
        type: Sequelize.STRING,
        allowNull: false
      },
      partial: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING
      },
      locale: {
        type: Sequelize.STRING,
        allowNull: false
      },
      articleSelector: {
        type: Sequelize.STRING
      },
      maxPosts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      updatePeriodicity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      dayOfWeek: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Newsletters');
  }
};