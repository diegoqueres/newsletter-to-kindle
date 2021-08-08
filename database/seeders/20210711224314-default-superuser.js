'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
     await queryInterface.bulkInsert('Users', [{
        name: 'admin',
        email: 'admin@diegoqueres.net',
        password: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        super: true
      }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {email: 'admin@diegoqueres.net'}, {});
  }
};
