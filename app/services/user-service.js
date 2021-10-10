const {User} = require('../models');
const random = require('random');
const crypto = require('crypto');
const {v4: uuidv4} = require('uuid');
const APIError = require('../errors/api-error');
const { Op } = require("sequelize");
const HttpStatus = require('../errors/http-status');
const Pagination = require('../libs/pagination');

class UserService {
    async save(userDto) {
        let {name, email, password, pendingConfirm, superUser} = userDto;
        const existantUser = await this.findByEmail(email);
        if (existantUser) {
            throw new APIError('Bad Request',HttpStatus.BAD_REQUEST,'User already exists');
        }

        const encryptResult = this.encryptPassword(password);
        password = encryptResult.encryptedPassword;

        let confirmCode = null;
        if (!pendingConfirm) {
            pendingConfirm = false;
        } else if (pendingConfirm === true) {
            confirmCode = random.int(1000, 9999);
        }

        return User.create({
            ... {name, email, password, pendingConfirm, confirmCode},
            salt: encryptResult.salt,
            super: superUser
        });
    }

    async editById(userId, userDto) {
        const user = await this.findById(userId);
        if (user == null) {
            throw new APIError('Not found',HttpStatus.NOT_FOUND,'User does not exists');
        }

        return this.edit(user, userDto);
    }

    async promote(userId) {
        const user = await this.findById(userId);
        if (user == null) 
            throw new APIError('Not found',HttpStatus.NOT_FOUND,'User does not exists');

        user.super = true;
        user.save();
        return user;
    }

    async edit(user, userDto) {
        const editedUser = user;
        if (userDto.name) editedUser.name = userDto.name;
        if (userDto.email) editedUser.email = userDto.email;
        if (userDto.pendingConfirm) editedUser.pendingConfirm = userDto.pendingConfirm;

        if (userDto.password) {
            const encryptResult = this.encryptPassword(userDto.password);
            editedUser.password = encryptResult.encryptedPassword;
            editedUser.salt = encryptResult.salt;
            editedUser.pendingPassword = false;
        }

        return editedUser.save();
    }

    async findByEmail(email) {
        return User.findOne({ where: { email } });
    }

    async findById(id) {
        return User.findByPk(id);
    }

    async findAll(filter) {
        const where = {};
        if (filter.name) {
            where.name = {
                [Op.like]: `%${filter.name}%`
            };
        }
        const page = Pagination.getPage(filter.page);
        const limit = filter.size;
        const offset = filter.page ? (page * limit) : 0;

        return User.findAndCountAll({
            limit,
            offset,
            attributes: { exclude: ['password', 'salt'] },
            where,
        });
    }

    async remove(user) {
        this.removeById(user.id);
    }

    async removeById(id) {
        User.destroy({
            where: {id}
        });
    }

    encryptPassword(password, salt = uuidv4()) {
        const encryptedPassword = crypto
            .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
            .toString('hex');
        return {encryptedPassword, salt};
    }
}
module.exports = UserService;