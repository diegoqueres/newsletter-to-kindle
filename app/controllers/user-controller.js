const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const { validationResult } = require('express-validator');
const {userLogger} = require('../../config/logger');
const UserService = require('../services/user-service');
const Pagination = require('../libs/pagination');

class UserController {
    static userService = new UserService();

    async listAll(req, res) {
        UserController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await UserController.getPermissions(req);

        const filter = Pagination.getFilter(req.query);
        if (req.query.name) 
            filter.name = req.query.name;

        const json = !permissionOnlyHimself
            ? Pagination.getPagingData(await UserController.userService.findAll(filter), filter.page, filter.size)
            : Pagination.getPagingDataForSingle(loggedUser, filter.page, filter.size);
        res.json(json);
    }

    async findById(req, res) {
        UserController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await UserController.getPermissions(req, false);
        const requestedId = parseInt(req.params.id);

        if (loggedUser.pendingPassword && loggedUser.id === requestedId) {
            res.json(loggedUser);
            next(res);
        } else {
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You must change your password before proceeding with this operation.');
        }

        if (permissionOnlyHimself) {
            if (loggedUser.id !== requestedId) {
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You don\'t have privileges to access another user\'s data');     
            }
            res.json(loggedUser);
            next(res);
        }

        const requestedUser = await UserController.userService.findById(requestedId);
        if (requestedUser == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'User not found');

        res.json(requestedUser);
    }

    async remove(req, res) {
        UserController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await UserController.getPermissions(req, false);
        const requestedId = parseInt(req.params.id);

        if (permissionOnlyHimself) {
            if (loggedUser.id !== requestedId) 
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You don\'t have privileges to delete another user');     
            if (loggedUser.pendingPassword)
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You must change your password before proceeding with this operation.');

            await UserController.userService.remove(loggedUser);
            res.status(HttpStatus.NO_CONTENT).json();
            UserController.logActivity(loggedUser, 'has been removed', loggedUser);
            next(res);
        }
        if (loggedUser.id === requestedId && loggedUser.pendingPassword) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You must change your password before proceeding with this operation.');

        const requestedUser = await UserController.userService.findById(requestedId);
        if (requestedUser == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'User not found');

        await UserController.userService.remove(requestedUser);
        res.status(HttpStatus.NO_CONTENT).json();
        UserController.logActivity(requestedUser, 'has been removed', loggedUser);
    }

    async create(req, res) {
        UserController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await UserController.getPermissions(req);

        if (permissionOnlyHimself) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You don\'t have privileges to create users');     

        const {name, email, password} = req.body;
        const superUser = req.body.super;
        const createdUser = await UserController.userService.save({name, email, password, superUser});

        res.status(HttpStatus.CREATED).json(createdUser);
        UserController.logActivity(createdUser, 'has been created', loggedUser);
    }

    async edit(req, res) {
        UserController.validate(req, res);
        const {loggedUser, permissionOnlyHimself, permissionSuper} = await UserController.getPermissions(req);
        const requestedId = parseInt(req.params.id);

        if (permissionOnlyHimself) {
            if (loggedUser.id !== requestedId) {
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You don\'t have privileges to edit another user');     
            }
            const {name, email, password} = req.body;
            const editedUser = await UserController.userService.edit(loggedUser, {name, email, password});
            res.status(HttpStatus.OK).json(editedUser);
            UserController.logActivity(editedUser, 'has been edited', loggedUser);
            next(res);
        }  

        const userDto = {name, email, password, pendingConfirm} = req.body;
        const editedUser = await UserController.userService.editById(requestedId, userDto);
        res.status(HttpStatus.OK).json(editedUser);
        UserController.logActivity(editedUser, 'has been edited', loggedUser);
    }

    async promote(req, res) {
        UserController.validate(req, res);
        const {loggedUser, permissionSuper} = await UserController.getPermissions(req);

        if (!permissionSuper)
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You don\'t have privileges to promote another user');  
        
        const requestedId = parseInt(req.params.id);
        if (loggedUser.id === requestedId)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'You cannot promote yourself'); 
            
        const user = await UserController.userService.promote(requestedId);
        const response = {
            message: 'User was promoted successfully',
            user
        }
        res.status(HttpStatus.OK).json(response);
        UserController.logActivity(user, 'has been promoted', loggedUser);
    }

    static async getPermissions(req, blockChangePassword = true) {
        const loggedUserId = req.userId; 
        const loggedUser = await UserController.userService.findById(loggedUserId);
        if (loggedUser == null) 
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'Logged user cannot be found!');

        if (blockChangePassword && loggedUser.pendingPassword)
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You must change your password before proceeding with this operation.');

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

    static logActivity(user, action, loggedUser) {
        const logMessage = `User #${user.id} "${user.name}"<${user.email}> ${action}.`;
        const meta = loggedUser ? {loggedUser: {id: loggedUser.id, name: loggedUser.name}} : null;
        userLogger.info(logMessage, meta);
    }
}

module.exports = UserController;