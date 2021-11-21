const express = require('express');
const { body, query } = require('express-validator');
const routes = express.Router();
const AuthController = require('../app/controllers/auth-controller');

const passwordMin = 8, passwordMax = 128;
const nameMin = 5, nameMax = 255;
const authController = new AuthController();


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
//----------------------------------------------------------------

// Subscriptions
const SubscriptionController = require('../app/controllers/subscription-controller');
const subscriptionController = new SubscriptionController();

routes.post('/subscriptions', [
    body('newsletterId', 'newsletterId is mandatory and must be a number').isInt(),
    body('email', 'email must be a valid email').isEmail(),
    body('kindleEmail', 'emailKindle must be a valid email').isEmail(),
    body('acceptedTerms', 'acceptedTerms is mandatory and must be true').isBoolean(),
], subscriptionController.create);

routes.post('/subscriptions/confirm', [
    body('token', 'token is mandatory').not().isEmpty()
], subscriptionController.confirm);

routes.get('/subscriptions/confirm', [
    query('token', 'token is mandatory').not().isEmpty()
], subscriptionController.confirm);

routes.post('/subscriptions/unsubscribe', [
    body('token', 'token is mandatory').not().isEmpty()
], subscriptionController.unsubscribe);

routes.get('/subscriptions/unsubscribe', [
    query('token', 'token is mandatory').not().isEmpty()
], subscriptionController.unsubscribe);
//----------------------------------------------------------------

module.exports = routes;