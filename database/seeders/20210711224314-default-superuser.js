'use strict';
require('dotenv').config();
const {v4: uuidv4} = require('uuid');
const UserService = require('../../app/services/user-service');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const date = new Date();
    const salt = uuidv4();
    const userService = new UserService();
    const password = process.env.APPLICATION_ADMIN_PASSWORD_INIT;
    const passwordData = userService.encryptPassword(password, salt);

     await queryInterface.bulkInsert('Users', [{
        name: 'admin',
        email: 'admin@diegoqueres.net',
        password: passwordData.encryptedPassword,
        salt: passwordData.salt,
        createdAt: date,
        updatedAt: date,
        pendingConfirm: false,
        pendingPassword: false,
        super: true
      }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {email: 'admin@diegoqueres.net'}, {});
  }
};
