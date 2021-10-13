const express = require('express');
const { body } = require('express-validator');
const routes = express.Router();
const {logApiAuthActivity} = require('../config/logger');
const AuthController = require('../app/controllers/auth-controller');

const passwordMin = 8, passwordMax = 128;
const nameMin = 5, nameMax = 255;
const authController = new AuthController();


// Middlewares
routes.use(logApiAuthActivity);

// Authentication
routes.post('/auth/register', [
    body('name', `name must have between ${nameMin} and ${nameMax} characters`).isLength({ min: nameMin, max: nameMax}),
    body('email', 'email is not valid').isEmail(),
    body('password', `password must have between ${passwordMin} and ${passwordMax} characters`).isLength({ min: passwordMin, max: passwordMax }),
], authController.register);

routes.post('/auth/login', [
    body('email', 'email is not valid').isEmail(),
    body('password', `password must have between ${passwordMin} and ${passwordMax} characters`).isLength({ min: passwordMin, max: passwordMax }),
], authController.login);

routes.post('/auth/forgot-password', [
    body('email', 'email is not valid').isEmail(),
], authController.forgotPassword);

module.exports = routes;