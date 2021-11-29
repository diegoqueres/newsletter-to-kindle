require('dotenv').config();
const {User} = require('../models');
const jwt = require('jsonwebtoken');
const { I18n } = require('i18n');
const {i18nConfig} = require('../../config/i18n.config');
const generator = require('generate-password');
const UserService = require('./user-service');
const EmailService = require('./email-service');
const APIError = require('../errors/api-error');
const HttpStatus = require('../errors/http-status');

class AuthService {
    constructor() {
        this.locale = process.env.APPLICATION_LOCALE;
        this.serviceName = process.env.SERVICE_NAME;

        this.userService = new UserService();
        this.emailService = new EmailService(this.locale);
        
        this.i18n = new I18n(i18nConfig);
        this.i18n.setLocale(this.locale.substr(0,2));
    }

    async register(userDto) {
        userDto.pendingConfirm = true;
        userDto.superUser = false;
        const createdUser = await this.userService.save(userDto);
        await this.sendConfirmEmail(createdUser);
        return createdUser;
    }

    async sendConfirmEmail(user) {
        const emailData = {
            toEmail: user.email,
            subject:  this.i18n.__('email.subject.confirm-account', {serviceName: this.serviceName}), 
            template: 'account-confirmation',
            context: {
                "name": user.name, 
                "confirmation-code": user.confirmCode,
                "confirmation-link": this.getLoginUrl()
            }
        };
        await this.emailService.sendMail(emailData);
    }

    async forgotPassword(userEmail) {
        const user = await this.userService.findByEmail(userEmail);
        if (!user) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'auth.user-not-found');

        const password = generator.generate({
            length: 12,
            symbols: true,
            numbers: true
        });
        const encryptData = this.userService.encryptPassword(password);

        user.password = encryptData.encryptedPassword;
        user.salt = encryptData.salt;
        user.pendingPassword = true;
        await user.save();

        this.sendForgotPasswordEmail(user, password);
        return user;
    }

    async sendForgotPasswordEmail(user, password) {
        const emailData = {
            toEmail: user.email,
            subject: this.i18n.__('email.subject.forgot-password', {serviceName: this.serviceName}), 
            template: 'forgot-password',
            context: {
                "name": user.name, 
                "temporary-password": password,
                "login-link": this.getLoginUrl()
            }
        };
        this.emailService.sendMail(emailData);
    }

    async confirmAccount(user, confirmationCode) {
        let confirmCode = -1;
        try {
            confirmCode = parseInt(confirmationCode);
        } catch (e) {}

        if (user.confirmCode !== confirmCode)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'auth.wrong-confirmation-code');

        user.pendingConfirm = false;
        user.save();
        return user;
    }

    async changePassword(user, password) {
        const encryptResult = this.userService.encryptPassword(password);
        user.password = encryptResult.encryptedPassword;
        user.salt = encryptResult.salt;
        user.pendingPassword = false;
        user.save();
        return user;
    }

    getLoginUrl() {
        return process.env.APPLICATION_FRONTEND_BASE_URL + process.env.APPLICATION_FRONTEND_LOGIN_ENDPOINT;
    }

    async signIn(userDto) {
        const {email, password} = userDto;

        const user = await this.userService.findByEmail(email);
        if (!user) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'auth.user-not-found');

        const salt = user.salt;
        const encryptData = this.userService.encryptPassword(password, salt);
        if (encryptData.encryptedPassword !== user.password)
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'auth.wrong-user-password');

        const token = jwt.sign({ userId: user.id }, process.env.API_SECRET, {
            expiresIn: parseInt(process.env.TOKEN_EXPIRATION)
        });
        return {user, token};
    }
}
module.exports = AuthService;