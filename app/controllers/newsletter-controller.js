const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const { validationResult } = require('express-validator');
const UserService = require('../services/user-service');
const NewsletterService = require('../services/newsletter-service');
const Pagination = require('../libs/pagination');

class NewsletterController {
    static userService = new UserService();
    static newsletterService = new NewsletterService();

    async listAllFromLoggedUser(req, res, next) {
        req.query.loggedUser = true;
        return listAll(req, res, next);      
    }

    async listAll(req, res, next) {
        NewsletterController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await NewsletterController.getPermissions(req);

        const filter = Pagination.getFilter(req.query);
        if (permissionOnlyHimself || (req.query.loggedUser && req.query.loggedUser === true))
            filter.userId = loggedUser.id;
        if (req.query.name) 
            filter.name = req.query.name;

        const json = Pagination.getPagingData(
            await NewsletterController.newsletterService.findAll(filter), filter.page, filter.size
        );

        res.json(json);
        next();
    }

    async findById(req, res, next) {
        NewsletterController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await NewsletterController.getPermissions(req);
        const requestedId = parseInt(req.params.id);

        const requestedNewsletter = await NewsletterController.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');

        if (permissionOnlyHimself && requestedNewsletter.userId !== loggedUser.id)
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-have-privileges-to-another-user-data');

        res.json(requestedNewsletter);
        next();
    }

    async create(req, res, next) {
        NewsletterController.validate(req, res);
        const newsletterDto = req.body;

        const {loggedUser, permissionOnlyHimself} = await NewsletterController.getPermissions(req);
        if (permissionOnlyHimself && loggedUser.id !== newsletterDto.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-create-to-another-users');     

        const createdNewsletter = await NewsletterController.newsletterService.save(newsletterDto);

        res.status(HttpStatus.CREATED).json(createdNewsletter);
        next();
    }

    async edit(req, res, next) {
        NewsletterController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await NewsletterController.getPermissions(req);
        const requestedId = parseInt(req.params.id);
        const newsletterDto = req.body;
        
        const requestedNewsletter = await NewsletterController.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');
        
        if (permissionOnlyHimself && loggedUser.id !== requestedNewsletter.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-edit-to-another-users');         
        
        if (permissionOnlyHimself && requestedNewsletter.userId !== newsletterDto.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-transfer-to-another-users');     

        const editedNewsletter = await NewsletterController.newsletterService.edit(requestedNewsletter, newsletterDto);

        res.status(HttpStatus.OK).json(editedNewsletter);
        next();
    }

    async activate(req, res, next) {
        NewsletterController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await NewsletterController.getPermissions(req);
        const requestedId = parseInt(req.params.id);
        
        const requestedNewsletter = await NewsletterController.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');
        
        if (permissionOnlyHimself && loggedUser.id !== requestedNewsletter.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-edit-to-another-users');              

        NewsletterController.newsletterService.activate(requestedNewsletter)
            .then(() => {
                res.status(HttpStatus.OK).json({
                    message: res.__('newsletter.activate-successfully'),
                    requestedNewsletter
                });
                next();
            });
    }

    async deactivate(req, res, next) {
        NewsletterController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await NewsletterController.getPermissions(req);
        const requestedId = parseInt(req.params.id);
        
        const requestedNewsletter = await NewsletterController.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');
        
        if (permissionOnlyHimself && loggedUser.id !== requestedNewsletter.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-edit-to-another-users');              

        NewsletterController.newsletterService.deactivate(requestedNewsletter)
            .then(() => {
                res.status(HttpStatus.OK).json({
                    message: res.__('newsletter.deactivate-successfully'),
                    requestedNewsletter
                });
                next();
            });     
    }

    async remove(req, res, next) {
        NewsletterController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await NewsletterController.getPermissions(req);
        const requestedId = parseInt(req.params.id);
        
        const requestedNewsletter = await NewsletterController.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');
        
        if (permissionOnlyHimself && loggedUser.id !== requestedNewsletter.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-edit-to-another-users');              

        NewsletterController.newsletterService.remove(requestedNewsletter)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
                next();
            });            
    }

    static async getPermissions(req, blockedByChangePassword = true) {
        const loggedUserId = req.userId; 
        const loggedUser = await NewsletterController.userService.findById(loggedUserId);
        if (loggedUser == null) 
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'auth.logged-user-not-found');

        if (blockedByChangePassword && loggedUser.pendingPassword)
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'auth.pendant-change-temporary-password');

        const permissions = {
            loggedUser,
            permissionOnlyHimself: ((!loggedUser.super) || (loggedUser.super && loggedUser.pendingConfirm)),
            permissionSuper: (loggedUser.super && !loggedUser.pendingConfirm)
        };
        return permissions;
    }

    static validate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) 
          return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({errors: errors.array()});
    }
}

module.exports = NewsletterController;