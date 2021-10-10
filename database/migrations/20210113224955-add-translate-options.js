'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Newsletters', // table name
        'translationTarget', // new field name
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
      ),
      queryInterface.addColumn(
        'Newsletters',
        'translationMode',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
      ),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn('Newsletters', 'translationTarget'),
      queryInterface.removeColumn('Newsletters', 'translationMode'),
    ]);
  }
};
