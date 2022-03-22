'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Newsletters', 'includeImgs', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Newsletters', 'includeImgs');
  }
};
