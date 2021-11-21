'use strict';
require('dotenv').config();
const {v4: uuidv4} = require('uuid');
const AuthService = require('../../app/services/auth-service');
const UserService = require('../../app/services/user-service');

const admin = {
  name: process.env.APPLICATION_ADMIN_INIT_NAME,
  email: process.env.APPLICATION_ADMIN_INIT_EMAIL,
  password: process.env.APPLICATION_ADMIN_INIT_PASSWORD
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const date = new Date();
    const salt = uuidv4();

    const userService = new UserService();
    const authService = new AuthService();
    const passwordData = userService.encryptPassword(admin.password, salt);

    await queryInterface.bulkInsert('Users', [{
        name: admin.name,
        email: admin.email,
        password: passwordData.encryptedPassword,
        salt: passwordData.salt,
        createdAt: date,
        updatedAt: date,
        pendingConfirm: false,
        pendingPassword: false,
        super: true
    }], {});

    //triggers password forgetting mechanism, for immediate change
    const user = await userService.findByEmail(admin.email);
    await authService.sendForgotPasswordEmail(user, admin.password);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {email: admin.email}, {});
  }
};
