'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Newsletters', 'useReadable', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Newsletters', 'useReadable');
  }
};
