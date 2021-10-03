const express = require('express');
const { check, query, param, body } = require('express-validator');
const routes = express.Router();
const Jwt = require('../app/libs/jwt');

const nameMin = 5, nameMax = 255;
const passwordMin = 8, passwordMax = 128;


// Authentication
const AuthController = require('../app/controllers/auth-controller');
const authController = new AuthController();

routes.post('/auth/confirm-account', [
    Jwt.verify,
    body('confirmationCode', 'confirmation code must be provided').not().isEmpty(),
], authController.confirmAccount);

routes.post('/auth/change-password', [
    Jwt.verify,
    body('newPassword', `password must have between ${passwordMin} and ${passwordMax} characters`).isLength({ min: passwordMin, max: passwordMax })
], authController.changePassword);
//----------------------------------------------------------------

// Users
const UserController = require('../app/controllers/user-controller');
const userController = new UserController();

routes.get('/user', [
    Jwt.verify,
    check('page', 'page must be a number greather than 0').if(query('page').exists()).isInt({ min:1 }),
    check('size', 'size must be a number greather than 0').if(query('size').exists()).isInt({ min:1 })
], userController.listAll);

routes.get('/user/:id', [
    Jwt.verify,
    param('id', 'id must be a number').isInt()
], userController.findById);

routes.delete('/user/:id', [
    Jwt.verify,
    param('id', 'id must be a number').isInt()
], userController.delete);

routes.post('/user', [
    Jwt.verify,
    check('name', 'name must be valid').isLength({ min: nameMin, max: nameMax}),
    check('email', 'email must be valid').normalizeEmail().isEmail(),
    check('password', `password must have between ${passwordMin} and ${passwordMax} characters`).isLength({ min: passwordMin, max: passwordMax }),
], userController.create);

routes.patch('/user/:id', [
    Jwt.verify,
    check('name', 'name must be valid').if(body('name').exists()).isLength({ min: nameMin, max: nameMax}),
    check('email', 'email must be valid').if(body('email').exists()).normalizeEmail().isEmail(),
    check('password', `password must have between ${passwordMin} and ${passwordMax} characters`).if(body('password').exists()).isLength({ min: passwordMin, max: passwordMax }),
], userController.edit);

routes.post('/user/:id/promote', [
    Jwt.verify,
    param('id', 'id must be a number').isInt()
], userController.promote);
//----------------------------------------------------------------

module.exports = routes;