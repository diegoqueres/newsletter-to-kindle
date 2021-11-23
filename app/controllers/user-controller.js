const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const BaseController = require('./base-controller');
const UserService = require('../services/user-service');
const Pagination = require('../libs/pagination');
const es6BindAll = require("es6bindall");

class UserController extends BaseController {
    constructor() {
        super();
        this.userService = new UserService();
        this.bindAll();
    }

    async listAll(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req);

        const filter = Pagination.getFilter(req.query);
        if (req.query.name) 
            filter.name = req.query.name;

        const json = !permissionOnlyHimself
            ? Pagination.getPagingData(await this.userService.findAll(filter), filter.page, filter.size)
            : Pagination.getPagingDataForSingle(loggedUser, filter.page, filter.size);

        res.json(json);
        next();
    }

    async findById(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, false);
        const requestedId = parseInt(req.params.id);

        if (permissionOnlyHimself) {
            if (loggedUser.id !== requestedId) 
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'user.not-have-privileges-to-another-user-data');     
            if (loggedUser.pendingPassword)
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'auth.pendant-change-temporary-password');

            res.json(loggedUser);
            return next(res);
        }

        const requestedUser = await this.userService.findById(requestedId);
        if (requestedUser == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'user.not-found');

        res.json(requestedUser);
        next();
    }

    async remove(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, false);
        const requestedId = parseInt(req.params.id);

        if (permissionOnlyHimself) {
            if (loggedUser.id !== requestedId) 
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'user.not-have-privileges-to-delete-users');     
            if (loggedUser.pendingPassword)
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'auth.pendant-change-temporary-password');

            await this.userService.remove(loggedUser);
            res.status(HttpStatus.NO_CONTENT).json();
            next(res);
        }
        if (loggedUser.id === requestedId && loggedUser.pendingPassword) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'auth.pendant-change-temporary-password');

        const requestedUser = await this.userService.findById(requestedId);
        if (requestedUser == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'user.not-found');

        await this.userService.remove(requestedUser);

        res.status(HttpStatus.NO_CONTENT).json();
        next();
    }

    async create(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, true, true);

        if (permissionOnlyHimself) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'user.not-have-privileges-to-create-users');     

        const {name, email, password} = req.body;
        const superUser = req.body.super;
        const createdUser = await this.userService.save({name, email, password, superUser});

        res.status(HttpStatus.CREATED).json(createdUser);
        next();
    }

    async edit(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);

        if (permissionOnlyHimself) {
            if (loggedUser.id !== requestedId) {
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'user.not-have-privileges-to-edit-users');     
            }
            const {name, email, password} = req.body;
            const editedUser = await this.userService.edit(loggedUser, {name, email, password});
            res.status(HttpStatus.OK).json(editedUser);
            return next(res);
        }  

        const userDto = {
            name: req.body.name, 
            email: req.body.email, 
            password: req.body.password, 
            pendingConfirm: req.body.pendingConfirm
        };
        const editedUser = await this.userService.editById(requestedId, userDto);

        res.status(HttpStatus.OK).json(editedUser);
        next();
    }

    async promote(req, res, next) {
        super.validate(req, res);
        const {loggedUser, permissionSuper} = await super.getPermissions(req, true, true);

        if (!permissionSuper)
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'user.not-have-privileges-to-promote-users');  
        
        const requestedId = parseInt(req.params.id);
        if (loggedUser.id === requestedId)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'user.not-have-privileges-to-promote-yourself'); 
            
        const user = await this.userService.promote(requestedId);

        const response = {
            message: res.__('user.promotion-successfully'),
            user
        }
        res.status(HttpStatus.OK).json(response);
        next();
    }

    bindAll() {
        es6BindAll(this, ['listAll', 'findById', 'remove', 'create', 'edit', 'promote']);
    }
}
module.exports = UserController;