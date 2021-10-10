'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'Newsletters', // table name
        'active', // new field name
        {
          type: Sequelize.DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
      ),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // logic for reverting the changes
    return Promise.all([
      queryInterface.removeColumn('Newsletters', 'active'),
    ]);
  }
};
