const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const BaseController = require('./base-controller');
const NewsletterService = require('../services/newsletter-service');
const Pagination = require('../libs/pagination');
const es6BindAll = require("es6bindall");

class NewsletterController extends BaseController {
    constructor() {
        super();
        this.newsletterService = new NewsletterService();
        this.bindAll();
    }

    async listAllFromLoggedUser(req, res, next) {
        req.query.loggedUser = true;
        return listAll(req, res, next);      
    }

    async listAll(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req);

        const filter = Pagination.getFilter(req.query);
        if (permissionOnlyHimself || (req.query.loggedUser && req.query.loggedUser === true))
            filter.userId = loggedUser.id;
        if (req.query.name) 
            filter.name = req.query.name;

        const json = Pagination.getPagingData(
            await this.newsletterService.findAll(filter), filter.page, filter.size
        );

        res.json(json);
        next();
    }

    async findById(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req);
        const requestedId = parseInt(req.params.id);

        const requestedNewsletter = await this.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');

        if (permissionOnlyHimself && requestedNewsletter.userId !== loggedUser.id)
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-have-privileges-to-another-user-data');

        res.json(requestedNewsletter);
        next();
    }

    async create(req, res, next) {
        super.validate(req, res);
        const newsletterDto = req.body;

        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, true, true);
        if (permissionOnlyHimself && loggedUser.id !== newsletterDto.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-create-to-another-users');     

        const createdNewsletter = await this.newsletterService.save(newsletterDto);

        res.status(HttpStatus.CREATED).json(createdNewsletter);
        next();
    }

    async edit(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);
        const newsletterDto = req.body;
        
        const requestedNewsletter = await this.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');
        
        if (permissionOnlyHimself && loggedUser.id !== requestedNewsletter.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-edit-to-another-users');         
        
        if (permissionOnlyHimself && requestedNewsletter.userId !== newsletterDto.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-transfer-to-another-users');     

        const editedNewsletter = await this.newsletterService.edit(requestedNewsletter, newsletterDto);

        res.status(HttpStatus.OK).json(editedNewsletter);
        next();
    }

    async activate(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);
        
        const requestedNewsletter = await this.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');
        
        if (permissionOnlyHimself && loggedUser.id !== requestedNewsletter.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-edit-to-another-users');              

        this.newsletterService.activate(requestedNewsletter)
            .then(() => {
                res.status(HttpStatus.OK).json({
                    message: res.__('newsletter.activate-successfully'),
                    requestedNewsletter
                });
                next();
            });
    }

    async deactivate(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);
        
        const requestedNewsletter = await this.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');
        
        if (permissionOnlyHimself && loggedUser.id !== requestedNewsletter.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-edit-to-another-users');              

        this.newsletterService.deactivate(requestedNewsletter)
            .then(() => {
                res.status(HttpStatus.OK).json({
                    message: res.__('newsletter.deactivate-successfully'),
                    requestedNewsletter
                });
                next();
            });     
    }

    async remove(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);
        
        const requestedNewsletter = await this.newsletterService.findById(requestedId);
        if (requestedNewsletter == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'newsletter.not-found');
        
        if (permissionOnlyHimself && loggedUser.id !== requestedNewsletter.userId) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'newsletter.not-allowed-edit-to-another-users');              

        this.newsletterService.remove(requestedNewsletter)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
                next();
            });            
    }

    bindAll() {
        es6BindAll(this, ['listAllFromLoggedUser', 'listAll', 'findById', 'create', 'edit', 'activate', 'deactivate', 'remove']);
    }
}
module.exports = NewsletterController;