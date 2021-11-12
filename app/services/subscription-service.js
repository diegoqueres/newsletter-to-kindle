require('dotenv').config();
const { Subscription } = require('../models');
const APIError = require('../errors/api-error');
const { Op } = require("sequelize");
const fs = require('fs');
const { I18n } = require('i18n');
const { v4: uuidv4 } = require('uuid');
const TempWriter = require('../utils/temp-file-writer');
const Encrypter = require('../utils/encrypt-utils');
const HttpStatus = require('../errors/http-status');
const Pagination = require('../libs/pagination');
const Handlebars = require('handlebars');
const EmailService = require('../services/email-service');
const SubscriberService = require('./subscriber-service');
const NewsletterService = require('./newsletter-service');

const path = require('path');
const salt = process.env.SUBSCRIPTION_SALT;
const { subscriptionLogger } = require('../../config/logger');
const { baseUrl } = require('../../config/system');

class SubscriptionService {
    constructor() {
        this.subscriberService = new SubscriberService();
        this.newsletterService = new NewsletterService();
    }

    async create(subscriber, newsletter, acceptedTerms) {
        const subscription = await this.findBySubscriberAndNewsletter(subscriber.id, newsletter.id);
        if (subscription)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'subscription.already-exists');

        const date = new Date();
        const token = `${uuidv4()}-${subscriber.id}-${newsletter.id}-${date.toISOString()}-${uuidv4()}`;
        const encryptedToken = Encrypter.encrypt(token, salt);

        const createdSubscription = await Subscription.create({
            subscriberId: subscriber.id,
            newsletterId: newsletter.id,
            acceptedTerms: acceptedTerms,
            token: encryptedToken
        });

        await this.sendConfirmationToKindle({ subscriber, newsletter, subscription: createdSubscription });
        return createdSubscription;
    }

    async sendConfirmationToKindle(params) {
        const { subscriber, newsletter, subscription } = params;
        const i18n = this.getNewI18N(newsletter.locale);
        const emailService = new EmailService(newsletter.locale);

        const title = i18n.__('newsletter.confirmation-email.subject', { newsletterName: newsletter.name });
        const htmlContent = await this.getHtmlContentForSubscriptionConfirmation(newsletter, title, subscription.token);
        const htmlFile =
            TempWriter.writeTempFile(`${title}.html`, htmlContent, newsletter.getEncoding());

        const emailData = {
            toEmail: subscriber.kindleEmail,
            subject: title,
            content: title,
            htmlContent: title,
            attachments: [htmlFile]
        }

        await emailService.sendMail(emailData);
    }

    async getHtmlContentForSubscriptionConfirmation(newsletter, title, token) {
        const templatePath = path.resolve(`./templates/${newsletter.locale}/subscription-confirmation.handlebars`);
        const templateContent = fs.readFileSync(templatePath, 'utf-8');

        const template = Handlebars.compile(templateContent);
        const context = {
            title: title,
            description: title,
            newsletter: {
                encoding: newsletter.getEncoding(),
                lang: newsletter.getLanguage(),
                author: newsletter.author,
                name: newsletter.name
            },
            "confirmation-link": this.getConfirmSubscriptionLink(token),
            "unsubscribe-link": 'http://<link to unsubscribe>'
        }
        return template(context);
    }

    async findBySubscriberAndNewsletter(subscriberId, newsletterId) {
        return Subscription.findOne({
            where: { subscriberId, newsletterId }
        });
    }

    async countBySubscriber(subscriberId) {
        return Subscription.count({
            where: { subscriberId }
        });
    }

    async findByToken(token) {
        return Subscription.findOne({
            where: { token }
        });
    }

    async findSubscriptionsToSend(newsletter) {
        return Subscription.findAll({
            where: {
                newsletterId: newsletter.id,
                pendingConfirm: false,
                acceptedTerms: true
            }
        });
    }

    async confirmSubscription(subscription, token) {
        if (subscription.token !== token) {
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'subscription.token.mismatch');
        }

        subscription.pendingConfirm = false;
        await subscription.save();

        this.logConfirmedSubscription(subscription);
    }

    async logConfirmedSubscription(subscription) {
        const subscriber = await this.subscriberService.findById(subscription.subscriberId);
        const newsletter = await this.newsletterService.findById(subscription.newsletterId);
        const date = new Date();

        subscriptionLogger.info(`User ${subscriber.email} has subscribed newsletter "${newsletter.name}" on your kindle email address (${subscriber.kindleEmail}) and has confirmed and accepted terms of service`, {
            subscriptionId: subscription.id,
            subscriberId: subscription.subscriberId,
            newsletterId: subscription.newsletterId,
            acceptedTerms: subscription.acceptedTerms,
            confirmedSubscription: true,
            subscriptionDate: subscription.createdAt.toISOString(),
            confirmationDate: date.toISOString()
        });
    }

    async unsubscribe(subscription, token) {
        if (subscription.token !== token) {
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'subscription.token.mismatch');
        }

        const subscriber = await this.subscriberService.findById(subscription.subscriberId);
        const newsletter = await this.newsletterService.findById(subscription.newsletterId);
        const { id, createdAt } = subscription;
        const data = { id, subscriber, newsletter, createdAt };

        await this.removeById(subscription.id)
            .then(async() => this.logUnsubscription(data))
            .then(async() => {
                const countSubscriptions = await this.countBySubscriber(data.subscriber.id);
                if (countSubscriptions === 0) 
                    this.subscriberService.removeById(data.subscriber.id);
            });
    }

    async logUnsubscription(data) {
        const { id, subscriber, newsletter, createdAt } = data;
        const date = new Date();

        subscriptionLogger.info(`User ${subscriber.email} has unsubscribed newsletter "${newsletter.name}" on your kindle email address (${subscriber.kindleEmail})`, {
            subscriptionId: id,
            subscriberId: subscriber.id,
            newsletterId: newsletter.id,
            subscriptionDate: createdAt.toISOString(),
            unsubscriptionDate: date.toISOString()
        });
    }

    async logRemoval(data) {
        const { id, subscriber, newsletter, createdAt, metaData } = data;
        const date = new Date();
        const userId = (metaData && metaData.userId) ? metaData.userId : null;

        subscriptionLogger.info(`User ${subscriber.email} was removed from newsletter "${newsletter.name}" on your kindle email address (${subscriber.kindleEmail})`, {
            subscriptionId: id,
            subscriberId: subscriber.id,
            newsletterId: newsletter.id,
            subscriptionDate: createdAt.toISOString(),
            removalDate: date.toISOString(),
            userId
        });
    }

    async findAll(filter) {
        const where = this.buildWhereClause(filter);
        const page = Pagination.getPage(filter.page);
        const limit = filter.size;
        const offset = filter.page ? (page * limit) : 0;

        return Subscription.findAndCountAll({
            limit,
            offset,
            where,
        });
    }

    async findById(id) {
        return Subscription.findByPk(id);
    }

    async remove(entity, metaData) {
        const {id, newsletterId, subscriberId, createdAt} = entity;
        await this.removeById(entity.id);

        const subscriber = await this.subscriberService.findById(subscriberId);
        const newsletter = await this.newsletterService.findById(newsletterId); 
        const data = { id, subscriber, newsletter, createdAt, metaData };           
        await this.removeById(entity.id)
            .then(async() => this.logRemoval(data))
            .then(async() => {
                const countSubscriptions = await this.countBySubscriber(data.subscriber.id);
                if (countSubscriptions === 0) 
                    this.subscriberService.removeById(data.subscriber.id);
            });
    }

    async removeById(id) {
        Subscription.destroy({
            where: { id }
        });
    }

    async removeAllSubscriptions(subscriber) {
        this.removeAllSubscriptions(subscriber.id);
    }

    async removeAllSubscriptions(subscriberId) {
        Subscription.destroy({
            where: { subscriberId }
        });
    }

    buildWhereClause(filter) {
        const where = {};
        if (filter.subscriberId) {
            where.subscriberId = {
                [Op.eq]: filter.subscriberId
            };
        }
        if (filter.newsletterId) {
            where.newsletterId = {
               [Op.eq]: filter.newsletterId
            }
        } 
        return where;   
    }

    getConfirmSubscriptionLink(token) {
        return `${baseUrl()}/public/subscriptions/confirm?token=${token}`;
    }

    getUnsubscriptionLink(token) {
        return `${baseUrl()}/public/subscriptions/unsubscribe?token=${token}`;
    }

    getNewI18N(locale) {
        const i18n = new I18n();
        i18n.configure({
            defaultLocale: locale.substr(0, 2),
            fallbacks: [
                { nl: 'en', 'en-*': 'en' },
                { nl: 'pt', 'pt-*': 'pt' },
            ],
            directory: path.join(__dirname, '../../locales')
        });
        return i18n;
    }
}
module.exports = SubscriptionService;