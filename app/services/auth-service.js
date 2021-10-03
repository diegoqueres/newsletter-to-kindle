require('dotenv').config();
const {User} = require('../models');
const jwt = require('jsonwebtoken');
const generator = require('generate-password');
const UserService = require('./user-service');
const EmailService = require('./email-service');
const APIError = require('../errors/api-error');
const HttpStatus = require('../errors/http-status');

class AuthService {
    constructor() {
        this.userService = new UserService();
        this.emailService = new EmailService();
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
            subject: 'Confirm your \'newsletter-to-kindle\' account', 
            template: 'account-confirmation',
            context: {
                "name": user.name, 
                "confirmation-code": user.confirmCode,
                "confirmation-link": "https://link.to.confirm.account"
            }
        };
        await this.emailService.sendMail(emailData);
    }

    async forgotPassword(userEmail) {
        const user = await this.userService.findByEmail(userEmail);
        if (!user) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'User not found');

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
    }

    async sendForgotPasswordEmail(user, password) {
        const emailData = {
            toEmail: user.email,
            subject: 'Your new temporary password to \'newsletter-to-kindle\' account', 
            template: 'forgot-password',
            context: {
                "name": user.name, 
                "temporary-password": password,
                "login-link": "https://link.to.login.account"
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
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'Wrong confirmation code');

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

    async signIn(userDto) {
        const {email, password} = userDto;

        const user = await this.userService.findByEmail(email);
        if (!user) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'User not found');

        const salt = user.salt;
        const encryptData = this.userService.encryptPassword(password, salt);
        if (encryptData.encryptedPassword !== user.password)
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'User or password does not match');

        const token = jwt.sign({ userId: user.id }, process.env.API_SECRET, {
            expiresIn: parseInt(process.env.TOKEN_EXPIRATION)
        });
        return token;
    }
}
module.exports = AuthService;