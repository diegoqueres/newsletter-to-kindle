const {Newsletter, Subscription} = require('../models');
const APIError = require('../errors/api-error');
const { Op } = require("sequelize");
const HttpStatus = require('../errors/http-status');
const Pagination = require('../libs/pagination');

class NewsletterService {
    async findByUser(user) {
        return Newsletter.findAll({
            where: {
              userId: user.id,
            }
        });          
    }

    async findById(id) {
        return Newsletter.findByPk(id);
    }

    async findAll(filter) {
        const where = this.buildWhereClause(filter);
        const page = Pagination.getPage(filter.page);
        const limit = filter.size;
        const offset = filter.page ? (page * limit) : 0;

        return Newsletter.findAndCountAll({
            limit,
            offset,
            where,
        });
    }

    async save(dto) {
        return Newsletter.create(dto);
    }

    async edit(entity, dto) {
         //mandatory
        entity.name = dto.name;  
        entity.website = dto.website;
        entity.feedUrl = dto.feedUrl;
        entity.author = dto.author;
        entity.partial = dto.partial;
        entity.locale = dto.locale;
        entity.updatePeriodicity = dto.updatePeriodicity;
        entity.active = dto.active;
        entity.userId = dto.userId;

        //optionals
        if (dto.subject || dto.subject === null) entity.subject = dto.subject;   
        if (dto.dayOfWeek || dto.dayOfWeek === null) entity.dayOfWeek = dto.dayOfWeek;
        if (dto.translationTarget || dto.translationTarget === null) entity.translationTarget = dto.translationTarget;
        if (dto.translationMode || dto.translationMode === null) entity.translationMode = dto.translationMode;
        if (dto.articleSelector || dto.articleSelector === null) entity.articleSelector = dto.articleSelector;
        if (dto.includeImgs || dto.includeImgs === null) entity.includeImgs = dto.includeImgs;
        if (dto.useReadable || dto.useReadable === null) entity.useReadable = dto.useReadable;

        return entity.save();
    }

    async remove(entity) {
        await Subscription.destroy({
            where: { newsletterId: entity.id }
        });

        this.removeById(entity.id);
    }

    async activate(entity) {
        entity.active = true;
        return entity.save();
    }

    async deactivate(entity) {
        entity.active = false;
        return entity.save();
    }

    async removeById(id) {
        Newsletter.destroy({
            where: {id}
        });
    }

    buildWhereClause(filter) {
        const where = {};
        if (filter.name) {
            where.name = {
                [Op.like]: `%${filter.name}%`
            };
        }
        if (filter.userId) {
            where.userId = {
               [Op.eq]: filter.userId
            }
        } 
        return where;   
    }
}
module.exports = NewsletterService;