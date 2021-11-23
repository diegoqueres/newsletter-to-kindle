require('dotenv').config();
const AuthService = require('../services/auth-service');
const UserService = require('../services/user-service');
const BaseController = require('./base-controller');
const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const es6BindAll = require("es6bindall");

class AuthController extends BaseController {
    constructor() {
        super();
        this.authService = new AuthService();
        this.userService = new UserService();
        this.bindAll();
    }

    async register(req, res, next) {
        super.validate(req, res);

        const {name, email, password} = req.body;
        const createdUser = await this.authService.register({name, email, password});

        res.status(HttpStatus.CREATED).json(createdUser);
        next();
    }

    async login(req, res, next) {
        super.validate(req, res);

        const {email, password} = req.body;
        const {user, token} = await this.authService.signIn({email, password});

        if (token) {
            res.status(HttpStatus.OK).json({
                message: res.__('auth.user-authenticated'),
                token,
                generateTime: new Date()
            });
        } else {
            throw new APIError();
        }
        next();
    }

    async confirmAccount(req, res, next) {
        super.validate(req, res);

        const loggedUserId = req.userId; 
        const loggedUser = await this.userService.findById(loggedUserId);
        if (loggedUser == null) 
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'auth.logged-user-not-found');

        const confirmationCode = req.body.confirmationCode;
        const user = await this.authService.confirmAccount(loggedUser, confirmationCode);    
        const response = {
            message: res.__('auth.account-confirmed'),
            user
        }

        res.status(HttpStatus.OK).json(response);
        next();
    }

    async forgotPassword(req, res, next) {
        super.validate(req, res);

        const userEmail = req.body.email;
        const user = await this.authService.forgotPassword(userEmail);

        const response = {
            message: res.__('auth.temporary-password-sent', {userEmail})
        }

        res.status(HttpStatus.OK).json(response);
        next();
    }

    async changePassword(req, res, next) {
        super.validate(req, res);

        const loggedUserId = req.userId; 
        const loggedUser = await this.userService.findById(loggedUserId);
        if (loggedUser == null) 
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'auth.logged-user-not-found');

        const password = req.body.newPassword;
        await this.authService.changePassword(loggedUser, password);

        const response = {
            message: res.__('auth.password-changed')
        }

        res.status(HttpStatus.OK).json(response); 
        next();
    }

    bindAll() {
        es6BindAll(this, ['register', 'login', 'confirmAccount', 'forgotPassword', 'changePassword']);
    }
}
module.exports = AuthController;