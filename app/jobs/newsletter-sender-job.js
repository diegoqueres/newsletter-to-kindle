require('dotenv').config();
const { I18n } = require('i18n');
const { i18nConfig } = require('../../config/i18n.config');
const iconv = require('iconv-lite');
const Scrapper = require('../services/scrapper');
const EmailService = require('../services/email-service');
const SubscriptionService = require('../services/subscription-service');
const SubscriberService = require('../services/subscriber-service');
const { Newsletter } = require('../models');
const { jobLogger } = require('../../config/logger');
const sanitizeHtml = require('sanitize-html');

class NewsletterSenderJob {
  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.subscriberService = new SubscriberService();
    this.emailService = new EmailService(process.env.APPLICATION_LOCALE, false);
    this.emailTemplate = {
      content: null,
      htmlContent: null,
      encoding: 'utf8'
    };
  }

  async sendNewsletters() {
    const newsletters = await Newsletter.findAll({ where: { active: true } });

    for (let newsletter of newsletters) {
      try {
        jobLogger.info(`Processing newsletter '${newsletter.name}'`);
        const subscriptions = await this.subscriptionService.findSubscriptionsToSend(newsletter);
        if (subscriptions.length === 0) {
          jobLogger.info(`No subscriptions were found to newsletter '${newsletter.name}'`);
          continue;
        }

        const scrapper = new Scrapper(newsletter);

        const posts = await scrapper.getPosts();
        if (posts.length === 0) {
          jobLogger.info('No posts were found');
          continue;
        }

        for (const post of posts) {
          jobLogger.info(`Starting of data collect of post '${post.title}'`);
          const completePost = await scrapper.scrapPost(post);

          jobLogger.info(`Sending post '${completePost.title}' to subscribers`);

          const subscribers = await this.subscriberService.findBySubscriptions(subscriptions);
          if (subscribers.length === 0) {
            continue;
          }

          const postData = { newsletter, subscriptions, subscribers, post: completePost };

          const statistics = await this.sendPostToSubscribers(postData)
          jobLogger.info(`Post '${completePost.title}' were sent to ${statistics.sent} subscribers of a total of ${statistics.total} successfully`);
        }
      } catch (err) {
        jobLogger.error(`Error when processing newsletter '${newsletter.name}': ${err}`,
          { errorMessage: err.message, errorStack: err.stack });
        console.error(err);
      }
    }
  }

  async sendPostToSubscribers(postData) {
    const { newsletter, subscriptions, subscribers, post } = postData;
    const emailData = this.handleFixedEmailData(post, newsletter);
    const handledPost = this.handlePost(post, newsletter);

    const statistics = {
      sent: 0,
      failed: 0,
      total: subscribers.length
    };

    const promises = [];
    for (const subscriber of subscribers) {
      const subscriptionsFounded = subscriptions.filter(el => el.subscriberId === subscriber.id);
      if (subscriptionsFounded.length === 0) continue;

      const subscriptionData = { subscription: subscriptionsFounded[0], subscriber };
      promises.push(this.sendPost(subscriptionData, emailData, handledPost, statistics));
    }
    await Promise.allSettled(promises);
    
    return statistics;
  }

  handleFixedEmailData(post, newsletter) {
    const emailData = { ...this.emailTemplate };
    emailData.subject = post.title;

    const i18n = new I18n(i18nConfig);
    i18n.setLocale(newsletter.getLanguage());
    const defaultEmailContent = i18n.__('post.default-content');
    emailData.content = defaultEmailContent;
    emailData.htmlContent = `<html><body><p>${defaultEmailContent}</p></body></html>`;

    return emailData;
  }

  handlePost(post, newsletter) {
    const i18n = new I18n(i18nConfig);
    i18n.setLocale(newsletter.getLanguage());

    post.locale = newsletter.getCurrentLocale();
    post.fileName = `(${newsletter.name}) ${post.title}.html`;
    post.fileEncoding = newsletter.getEncoding();
    post.unsubscriptionLabel = i18n.__('post.label.unsubscription-link')
    return post;
  }

  async sendPost(subscriptionData, emailData, post, statistics) {
    const finalEmailData = this.handleDynamicEmailData(subscriptionData, post, emailData);
    await this.emailService.sendMail(finalEmailData)
      .then(() => statistics.sent++)
      .catch((err) => {
        statistics.failed++;
        console.warn(err);
      });
  }

  handleDynamicEmailData(subscriptionData, post, emailData) {
    const { subscription, subscriber } = subscriptionData;

    const dynamicEmailData = { ...emailData };
    dynamicEmailData.toEmail = subscriber.kindleEmail;
    dynamicEmailData.attachments = [];
    dynamicEmailData.attachments.push({
      filename: post.fileName,
      content: this.handleContent(subscription, post)
    });

    return dynamicEmailData;
  }

  handleContent(subscription, post) {
    const contentSufix = '<br>' 
      + '<em>' + post.unsubscriptionLabel + ': ' + this.getUnsubscriptionLink(subscription) + '</em>'
      + '</p></footer></body></html>';
      
    const content = post.htmlContent + contentSufix;

    return post.fileEncoding !== 'UTF-8'
      ? iconv.encode(content, post.fileEncoding)
      : content;
  }

  getUnsubscriptionLink(subscription) {
    const unsubscriptionLink = this.subscriptionService.getUnsubscriptionLink(subscription.token);
    return '<a href="' + unsubscriptionLink + '" target="_blank">' + unsubscriptionLink + '</a>';
  }
}
module.exports = NewsletterSenderJob;