'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Newsletters', 'dayOfWeek', { type: Sequelize.STRING(14) });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Newsletters', 'dayOfWeek', { type: Sequelize.INTEGER });
  }
};
