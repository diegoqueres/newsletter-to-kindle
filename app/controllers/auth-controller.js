require('dotenv').config();
const AuthService = require('../services/auth-service');
const UserService = require('../services/user-service');
const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const { validationResult } = require('express-validator');

class AuthController {
    async register(req, res, next) {
        AuthController.validate(req, res);
        const authService = new AuthService();

        const {name, email, password} = req.body;
        const createdUser = await authService.register({name, email, password});

        res.status(HttpStatus.CREATED).json(createdUser);
        next();
    }

    async login(req, res, next) {
        AuthController.validate(req, res);
        const authService = new AuthService();

        const {email, password} = req.body;
        const {user, token} = await authService.signIn({email, password});

        if (token) {
            res.status(HttpStatus.OK).json({
                message: 'User authenticated',
                token,
                generateTime: new Date()
            });
        } else {
            throw new APIError();
        }
        next();
    }

    async confirmAccount(req, res, next) {
        AuthController.validate(req, res);
        const authService = new AuthService();
        const userService = new UserService();

        const loggedUserId = req.userId; 
        const loggedUser = await userService.findById(loggedUserId);
        if (loggedUser == null) 
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'Logged user cannot be found!');

        const confirmationCode = req.body.confirmationCode;
        const user = await authService.confirmAccount(loggedUser, confirmationCode);    
        const response = {
            message: 'Account has been confirmed successfully',
            user
        }

        res.status(HttpStatus.OK).json(response);
        next();
    }

    async forgotPassword(req, res, next) {
        AuthController.validate(req, res);
        const authService = new AuthService();

        const userEmail = req.body.email;
        const user = await authService.forgotPassword(userEmail);

        const response = {
            message: `Temporary password has been sent to '${userEmail}'`
        }

        res.status(HttpStatus.OK).json(response);
        next();
    }

    async changePassword(req, res, next) {
        AuthController.validate(req, res);
        const authService = new AuthService();
        const userService = new UserService();

        const loggedUserId = req.userId; 
        const loggedUser = await userService.findById(loggedUserId);
        if (loggedUser == null) 
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'Logged user cannot be found!');

        const password = req.body.newPassword;
        await authService.changePassword(loggedUser, password);

        const response = {
            message: 'Password has been changed!'
        }

        res.status(HttpStatus.OK).json(response); 
        next();
    }

    static validate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) 
          return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({errors: errors.array()});
    }
}

module.exports = AuthController;