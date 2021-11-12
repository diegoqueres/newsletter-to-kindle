const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const { validationResult } = require('express-validator');
const UserService = require('../services/user-service');

class BaseController {
    constructor() {
        this.userService = new UserService();
    }

    /**
     * Abstract method bindAll()
     */
    bindAll() {
        throw new Error('You have to implement the method bindAll!');
    }

    async getPermissions(req, blockByChangePassword = true, blockByPendingConfirmAccount = false) {
        const loggedUserId = req.userId; 
        const loggedUser = await this.userService.findById(loggedUserId);
        if (loggedUser == null) 
            throw new APIError('Unauthorized', HttpStatus.UNAUTHORIZED, 'auth.logged-user-not-found');

        if (blockByChangePassword && loggedUser.pendingPassword)
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'auth.pendant-change-temporary-password');

        if (blockByPendingConfirmAccount && loggedUser.pendingConfirm)
            throw new APIError('Forbidden', HttpStatus.FORBIDDEN, 'auth.pendant-confirm-account');

        const permissions = {
            loggedUser,
            permissionOnlyHimself: ((!loggedUser.super) || (loggedUser.super && loggedUser.pendingConfirm)),
            permissionSuper: (loggedUser.super && !loggedUser.pendingConfirm)
        };
        return permissions;
    }

    validate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) 
          return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({errors: errors.array()});
    }
}
module.exports = BaseController;