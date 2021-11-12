const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const { validationResult } = require('express-validator');
const BaseController = require('./base-controller');
const SubscriberService = require('../services/subscriber-service');
const Pagination = require('../libs/pagination');
const es6BindAll = require("es6bindall");

class SubscriberController extends BaseController {
    constructor() {
        super();
        this.subscriberService = new SubscriberService();
        this.bindAll();
    }

    async listAll(req, res, next) {
        super.validate(req, res);
        await super.getPermissions(req, true, true);

        const filter = Pagination.getFilter(req.query);
        if (req.query.email) 
            filter.email = req.query.email;
        if (req.query.kindleEmail) 
            filter.kindleEmail = req.query.kindleEmail;

        const json = Pagination.getPagingData(
            await this.subscriberService.findAll(filter), filter.page, filter.size
        );

        res.status(HttpStatus.OK).json(json);
        next();
    }

    async findById(req, res, next) {
        super.validate(req, res);
        await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);

        const requestedSubscriber = await this.subscriberService.findById(requestedId);
        if (requestedSubscriber == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'subscriber.not-found');

        res.status(HttpStatus.OK).json(requestedSubscriber);
        next();
    }

    async remove(req, res, next) {
        super.validate(req, res);
        const {loggedUser} = await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);
        
        const requestedSubscriber = await this.subscriberService.findById(requestedId);
        if (requestedSubscriber == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'subscriber.not-found');              

        this.subscriberService.remove(requestedSubscriber, {userId: loggedUser.id})
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
                next();
            });            
    }

    bindAll() {
        es6BindAll(this, ["listAll", "findById", "remove"]);
    }
}
module.exports = SubscriberController;