'use strict';
require('dotenv').config();
const APIError = require('../errors/api-error');
const { Op } = require("sequelize");
const HttpStatus = require('../errors/http-status');
const Pagination = require('../libs/pagination');
const SubscriptionService = require('./subscription-service.js');

const { Subscriber, Subscription } = require('../models');
const { subscriptionLogger } = require('../../config/logger');

class SubscriberService {
    async findAll(filter) {
        const where = this.buildWhereClause(filter);
        const page = Pagination.getPage(filter.page);
        const limit = filter.size;
        const offset = filter.page ? (page * limit) : 0;

        return Subscriber.findAndCountAll({
            limit,
            offset,
            where,
        });
    }

    async findOrCreate(filter) {
        if (!(filter.email && filter.kindleEmail))
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'subscriber.create.mandatory-fields');

        const where = this.buildWhereClause(filter);
        const subscribers = await Subscriber.findAll({where});
        if (subscribers.length > 0) 
            return subscribers[0];

        return Subscriber.create(filter);
    }

    async findById(id) {
        return Subscriber.findByPk(id);
    }

    async findBySubscriptions(subscriptions) {
        const subscribersId = subscriptions.map(subscription => subscription.subscriberId);
        return Subscriber.findAll({
            where: {
                id: { [Op.in]: subscribersId }
            }
        });
    }

    async remove(entity, metaData) {
        const { id, email, createdAt } = entity;

        Subscription.destroy({
            where: { subscriberId: entity.id }
        })
          .then(() => this.removeById(entity.id))
          .then(() => this.logRemoval({ id, email, createdAt, metaData }));
    }

    async removeById(id) {
        Subscriber.destroy({
            where: {id}
        });
    }

    async logRemoval(data) {
        const { id, email, createdAt, metaData } = data;
        const date = new Date();
        const userId = (metaData && metaData.userId) ? metaData.userId : null;

        subscriptionLogger.info(`User ${email} was removed and your subscriptions has been canceled`, {
            subscriberId: id,
            createdDate: createdAt.toISOString(),
            removalDate: date.toISOString(),
            userId
        });
    }

    buildWhereClause(filter) {
        const where = {};
        if (filter.email) {
            where.email = {
                [Op.eq]: filter.email
            };
        }
        if (filter.kindleEmail) {
            where.kindleEmail = {
                [Op.eq]: filter.kindleEmail
            };
        }
        return where;   
    }
}
module.exports = SubscriberService;