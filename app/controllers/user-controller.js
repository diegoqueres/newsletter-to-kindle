const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const { validationResult } = require('express-validator');
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
        return res.json(json);
    }

    async findById(req, res) {
        UserController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await UserController.getPermissions(req, false);
        const requestedId = parseInt(req.params.id);

        if (loggedUser.pendingPassword && loggedUser.id === requestedId) {
            res.json(loggedUser);
        } else {
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You must change your password before proceeding with this operation.');
        }

        if (permissionOnlyHimself) {
            if (loggedUser.id !== requestedId) {
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You don\'t have privileges to access another user\'s data');     
            }
            res.json(loggedUser);
        }

        const requestedUser = await UserController.userService.findById(requestedId);
        if (requestedUser == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'User not found');

        res.json(requestedUser);
    }

    async delete(req, res) {
        UserController.validate(req, res);
        const {loggedUser, permissionOnlyHimself} = await UserController.getPermissions(req, false);
        const requestedId = parseInt(req.params.id);

        if (loggedUser.pendingPassword && loggedUser.id === requestedId) {
            await UserController.userService.delete(loggedUser);
            res.status(HttpStatus.NO_CONTENT).json('');
        } else {
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You must change your password before proceeding with this operation.');
        }

        if (permissionOnlyHimself) {
            if (loggedUser.id !== requestedId) {
                throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You don\'t have privileges to delete another user');     
            }
            await UserController.userService.delete(loggedUser);
            res.status(HttpStatus.NO_CONTENT).json('');
        }

        const requestedUser = await UserController.userService.findById(requestedId);
        if (requestedUser == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'User not found');

        await UserController.userService.delete(requestedUser);
        res.status(HttpStatus.NO_CONTENT).json('');
    }

    async create(req, res) {
        UserController.validate(req, res);
        const {permissionOnlyHimself} = await UserController.getPermissions(req);

        if (permissionOnlyHimself) 
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'You don\'t have privileges to create users');     

        const {name, email, password} = req.body;
        const superUser = req.body.super;
        const createdUser = await UserController.userService.save({name, email, password, superUser});

        res.status(HttpStatus.CREATED).json(createdUser);
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
        }  

        const userDto = {name, email, password, pendingConfirm} = req.body;
        const editedUser = await UserController.userService.editById(requestedId, userDto);
        res.status(HttpStatus.OK).json(editedUser);
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
}

module.exports = UserController;