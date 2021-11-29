const express = require('express');
const { check, query, param, body } = require('express-validator');
const routes = express.Router();
const Jwt = require('../app/libs/jwt');
const nameMin = 5, nameMax = 255;
const passwordMin = 8, passwordMax = 128;


// Middlewares
const middlewares = [ Jwt.verify ];


// Authentication
const AuthController = require('../app/controllers/auth-controller');
const authController = new AuthController();

routes.post('/auth/confirm-account', [
    middlewares,
    body('confirmationCode', 'confirmation code must be provided').not().isEmpty(),
], authController.confirmAccount);

routes.post('/auth/change-password', [
    middlewares,
    body('newPassword', `password must have between ${passwordMin} and ${passwordMax} characters`).isLength({ min: passwordMin, max: passwordMax })
], authController.changePassword);
//----------------------------------------------------------------

// Users
const UserController = require('../app/controllers/user-controller');
const userController = new UserController();

routes.get('/users', [
    middlewares,
    check('page', 'page must be a number greather than 0').if(query('page').exists()).isInt({ min:1 }),
    check('size', 'size must be a number greather than 0').if(query('size').exists()).isInt({ min:1 })
], userController.listAll);

routes.get('/users/:id', [
    middlewares,
    param('id', 'id must be a number').isInt()
], userController.findById);

routes.delete('/users/:id', [
    middlewares,
    param('id', 'id must be a number').isInt()
], userController.remove);

routes.post('/users', [
    middlewares,
    check('name', 'name must be valid').isLength({ min: nameMin, max: nameMax}),
    check('email', 'email must be valid').normalizeEmail().isEmail(),
    check('password', `password must have between ${passwordMin} and ${passwordMax} characters`).isLength({ min: passwordMin, max: passwordMax }),
], userController.create);

routes.patch('/users/:id', [
    middlewares,
    check('name', 'name must be valid').if(body('name').exists()).isLength({ min: nameMin, max: nameMax}),
    check('email', 'email must be valid').if(body('email').exists()).normalizeEmail().isEmail(),
    check('password', `password must have between ${passwordMin} and ${passwordMax} characters`).if(body('password').exists()).isLength({ min: passwordMin, max: passwordMax }),
], userController.edit);

routes.post('/users/:id/promote', [
    middlewares,
    param('id', 'id must be a number').isInt()
], userController.promote);
//----------------------------------------------------------------

// Newsletters
const NewsletterController = require('../app/controllers/newsletter-controller');
const newsletterController = new NewsletterController();

routes.get('/newsletters', [
    middlewares,
    query('page', 'page must be a number greather than 0').if(query('page').exists()).isInt({ min:1 }),
    query('size', 'size must be a number greather than 0').if(query('size').exists()).isInt({ min:1 })
], newsletterController.listAll);

routes.get('/newsletters/logged-user', [
    middlewares,
    query('page', 'page must be a number greather than 0').if(query('page').exists()).isInt({ min:1 }),
    query('size', 'size must be a number greather than 0').if(query('size').exists()).isInt({ min:1 })
], newsletterController.listAllFromLoggedUser);

routes.get('/newsletters/:id', [
    middlewares,
    param('id', 'id must be a number').isInt()
], newsletterController.findById);

routes.post('/newsletters', [
    middlewares,
    check('name', `name must be provided and have between ${nameMin} and ${nameMax} characters`).isLength({ min: nameMin, max: nameMax}),
    check('feedUrl', 'feedUrl must be valid').isURL(),
    check('author', `author must have between ${nameMin} and ${nameMax} characters`).isLength({ min: nameMin, max: nameMax}),
    check('partial', 'partial must be a boolean and must be provided').isBoolean(),
    check('subject', 'subject must be a string').if(body('subject').exists({checkNull: true})).isString(),
    check('locale', 'locale must be valid').isLocale(),
    check('articleSelector', 'articleSelector must be a string').if(body('articleSelector').exists({checkNull: true})).isString(),
    check('updatePeriodicity', 'updatePeriodicity must be a number').isInt(),
    check('dayOfWeek', 'dayOfWeek must be a number').if(body('dayOfWeek').exists({checkNull: true})).isInt(),
    check('translationTarget', 'translationTarget must be a number').if(body('translationTarget').exists({checkNull: true})).isLocale(),
    check('translationMode', 'translationMode must be a number').if(body('translationMode').exists({checkNull: true})).isInt(),
    check('active', 'active must be a boolean and must be provided').isBoolean(),
    check('userId', 'userId must be a number and must be provided').isInt()
], newsletterController.create);

routes.put('/newsletters/:id', [
    middlewares,
    param('id', 'id must be a number').isInt(),
    check('name', `name must be provided and have between ${nameMin} and ${nameMax} characters`).isLength({ min: nameMin, max: nameMax}),
    check('feedUrl', 'feedUrl must be valid').isURL(),
    check('author', `author must have between ${nameMin} and ${nameMax} characters`).isLength({ min: nameMin, max: nameMax}),
    check('partial', 'partial must be a boolean and must be provided').isBoolean(),
    check('subject', 'subject must be a string').if(body('subject').exists({checkNull: true})).isString(),
    check('locale', 'locale must be valid').isLocale(),
    check('articleSelector', 'articleSelector must be a string').if(body('articleSelector').exists({checkNull: true})).isString(),
    check('updatePeriodicity', 'updatePeriodicity must be a number').isInt(),
    check('dayOfWeek', 'dayOfWeek must be a number').if(body('dayOfWeek').exists({checkNull: true})).isInt(),
    check('translationTarget', 'translationTarget must be a number').if(body('translationTarget').exists({checkNull: true})).isLocale(),
    check('translationMode', 'translationMode must be a number').if(body('translationMode').exists({checkNull: true})).isInt(),
    check('active', 'active must be a boolean and must be provided').isBoolean(),
    check('userId', 'userId must be a number and must be provided').isInt()
], newsletterController.edit);

routes.patch('/newsletters/:id/activate', [
    middlewares,
    param('id', 'id must be a number').isInt()
], newsletterController.activate);

routes.patch('/newsletters/:id/deactivate', [
    middlewares,
    param('id', 'id must be a number').isInt()
], newsletterController.deactivate);

routes.delete('/newsletters/:id', [
    middlewares,
    param('id', 'id must be a number').isInt()
], newsletterController.remove);
//----------------------------------------------------------------

// Subscribers
const SubscriberController = require('../app/controllers/subscriber-controller');
const subscriberController = new SubscriberController();

routes.get('/subscribers', [
    middlewares,
    query('email', 'email must be a valid email').if(query('email').exists()).isEmail(),
    query('kindleEmail', 'kindle email must be a valid email').if(query('kindleEmail').exists()).isEmail(),
    query('kindleEmail', 'kindle email must end like \'@kindle.com\'').if(query('kindleEmail').exists()).matches(/.+@kindle.com/gmi),
    query('page', 'page must be a number greather than 0').if(query('page').exists()).isInt({ min:1 }),
    query('size', 'size must be a number greather than 0').if(query('size').exists()).isInt({ min:1 })
], subscriberController.listAll);

routes.get('/subscribers/:id', [
    middlewares,
    param('id', 'id must be a number').isInt()
], subscriberController.findById);

routes.delete('/subscribers/:id', [
    middlewares,
    param('id', 'id must be a number').isInt()
], subscriberController.remove);
//----------------------------------------------------------------

// Subscriptions
const SubscriptionController = require('../app/controllers/subscription-controller');
const subscriptionController = new SubscriptionController();

routes.get('/subscriptions', [
    middlewares,
    query('subscriberId', 'subscriberId must be number').if(query('subscriberId').exists()).isInt(),
    query('newsletterId', 'newsletterId must be number').if(query('newsletterId').exists()).isInt(),
    query('page', 'page must be a number greather than 0').if(query('page').exists()).isInt({ min:1 }),
    query('size', 'size must be a number greather than 0').if(query('size').exists()).isInt({ min:1 })
], subscriptionController.listAll);

routes.get('/subscriptions/:id', [
    middlewares,
    param('id', 'id must be a number').isInt()
], subscriptionController.findById);

routes.delete('/subscriptions/:id', [
    middlewares,
    param('id', 'id must be a number').isInt()
], subscriptionController.remove);
//----------------------------------------------------------------

module.exports = routes;