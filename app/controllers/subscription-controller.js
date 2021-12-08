const HttpStatus = require('../errors/http-status');
const APIError = require('../errors/api-error');
const BaseController = require('./base-controller');
const SubscriptionService = require('../services/subscription-service');
const NewsletterService = require('../services/newsletter-service');
const SubscriberService = require('../services/subscriber-service');
const Pagination = require('../libs/pagination');
const es6BindAll = require("es6bindall");

class SubscriptionController extends BaseController {
    constructor() {
        super();
        this.subscriberService = new SubscriberService();
        this.newsletterService = new NewsletterService();
        this.subscriptionService = new SubscriptionService();
        this.bindAll();
    }

    async create(req, res, next) {
        super.validate(req, res);

        const newsletter = await this.newsletterService.findById(req.body.newsletterId);
        if (!newsletter)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'newsletter.not-found');

        const acceptedTerms = req.body.acceptedTerms;
        if (!acceptedTerms)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'subscription.must-accept-terms');

        const subscriberDto = {
            email: req.body.email,
            kindleEmail: req.body.kindleEmail,
        }
        const subscriber = await this.subscriberService.findOrCreate(subscriberDto);

        const createdSubscription =
            await this.subscriptionService.create(subscriber, newsletter, acceptedTerms);

        res.status(HttpStatus.CREATED)
            .json({
                message: res.__('subscription.created-successfully'),
                subscription: {
                    id: createdSubscription.id,
                    newsletterId: createdSubscription.newsletterId,
                    newsletterName: newsletter.name,
                    subscriberId: createdSubscription.subscriberId,
                    subscriberName: subscriber.name,
                    subscriberEmail: subscriber.email,
                    subscriberKindleEmail: subscriber.kindleEmail,
                    acceptedTerms: createdSubscription.acceptedTerms,
                    confirmationLink: this.subscriptionService.getConfirmSubscriptionLink(createdSubscription.token),
                    createdAt: createdSubscription.createdAt
                }
            });
        next();
    }

    async confirm(req, res, next) {
        if (req.method === 'GET') {
            res.setHeader('Content-Type', 'text/html');
            res.html = true;
        }
        super.validate(req, res);

        const token = req.body.token || req.query.token;
        const subscription = await this.subscriptionService.findByToken(token);

        if (subscription == null)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'subscription.token.mismatch');

        if (subscription.pendingConfirm === false)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'subscription.already-confirmed');

        await this.subscriptionService.confirmSubscription(subscription, token);
        const newsletter = await this.newsletterService.findById(subscription.newsletterId);

        if (res.html && res.html === true) {
            const html = `<h2>${res.__('subscription.confirmed', { newsletterName: newsletter.name })}</h2>`;
            res.send(html);
        } else {
            const message = res.__('subscription.confirmed');
            res.json({ message });
        }
        next();
    }

    async unsubscribe(req, res, next) {
        if (req.method === 'GET') {
            res.setHeader('Content-Type', 'text/html');
            res.html = true;
        }

        super.validate(req, res);

        const token = req.body.token || req.query.token;
        const subscription = await this.subscriptionService.findByToken(token);

        if (subscription == null)
            throw new APIError('Bad Request', HttpStatus.BAD_REQUEST, 'subscription.not-found');

        const newsletter = await this.newsletterService.findById(subscription.newsletterId);
        await this.subscriptionService.unsubscribe(subscription, token);

        const message = this.buildUnsubscribeMessage(newsletter, req, res);
        if (res.html && res.html === true) {
            res.send(message);
        } else {
            res.json({ message });
        }
        next();
    }

    buildUnsubscribeMessage(newsletter, req, res) {
        const isHtml = res.html && res.html === true;
        const isShowCompact = req.query.show_compact_message && req.query.show_compact_message === 'true'
                                || req.body.show_compact_message && req.body.show_compact_message === true;

        let message = '';
        message += isHtml ? '<h2>' : '';
        message += res.__('subscription.unsubscribe-confirmation', { newsletterName: newsletter.name });
        message += isHtml ? '</h2>' : '';

        if (isShowCompact) return message;

        message += isHtml ? '<p>' : ' ';
        message += res.__('subscription.unsubscribe-confirmation.additional-alert');
        message += isHtml ? `<a href="${newsletter.website}">${newsletter.website}</a>).` : `${newsletter.website}).`;
        message += isHtml ? '</p>' : '';
        return message;
    }

    async remove(req, res, next) {
        super.validate(req, res);
        await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);
        
        const requestedSubscription = await this.subscriptionService.findById(requestedId);
        if (requestedSubscription == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'subscription.not-found');
                 
        this.subscriptionService.remove(requestedSubscription)
            .then(() => {
                res.status(HttpStatus.NO_CONTENT).json();
                next();
            });            
    }

    async listAll(req, res, next) {
        super.validate(req, res);
        await super.getPermissions(req, true, true);

        const filter = Pagination.getFilter(req.query);
        if (req.query.subscriberId) filter.subscriberId = req.query.subscriberId;
        if (req.query.newsletterId) filter.newsletterId = req.query.newsletterId;

        const json = Pagination.getPagingData(
            await this.subscriptionService.findAll(filter), filter.page, filter.size
        );

        res.json(json);
        next();
    }

    async findById(req, res, next) {
        super.validate(req, res);
        await super.getPermissions(req, true, true);
        const requestedId = parseInt(req.params.id);

        const requestedSubscription = await this.subscriptionService.findById(requestedId);
        if (requestedSubscription == null) 
            throw new APIError('Not found', HttpStatus.NOT_FOUND, 'subscription.not-found');

        res.json(requestedSubscription);
        next();
    }

    bindAll() {
        es6BindAll(this, ['create', 'confirm', 'unsubscribe', 'remove', 'listAll', 'findById']);
    }
}
module.exports = SubscriptionController;