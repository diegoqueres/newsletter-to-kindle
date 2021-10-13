const Scrapper = require('../services/scrapper');
const EmailService = require('../services/email-service');
const TempWriter = require('../utils/temp-file-writer');
const ConversionUtils = require('../utils/conversion-utils');
const ValidationUtils = require('../utils/validation-utils');
const {Newsletter} = require('../models');
const {jobLogger} = require('../../config/logger');
const emailData = require('../../config/email-data');

const ebookSender = async() => {
  const newsletters = await Newsletter.findAll({where: {active: true}});
  
  for (let newsletter of newsletters) {
    try {
      jobLogger.info(`Processing newsletter '${newsletter.name}'`);
      let scrapper = new Scrapper(newsletter, getDebug());
      let posts = await scrapper.getPosts();

      for (let post of posts) {
        jobLogger.info(`Starting of data collect of post '${post.title}'`);
        post = await scrapper.scrapPost(post); 
        const htmlFile = 
          TempWriter.writeTempFileWithSubjectAndTitle(newsletter.subject, post.title, 'htm', post.htmlContent, newsletter.getEncoding());
        
        jobLogger.info(`Sending post '${post.title}' to subscribers`);
        await sendMail(post, htmlFile);
        jobLogger.info(`Post '${post.title}' was sent to subscribers successfully`);
      }

      if (posts.length == 0)
        jobLogger.info('No posts where found');
    } catch (err) {
      jobLogger.error(`Error when processing newsletter '${newsletter.name}': ${err}`);
    }
  };
}

function getDebug() {
  return ValidationUtils.validNonEmptyString(process.env.DEBUG)
  ? ConversionUtils.stringToBoolean(process.env.DEBUG)
  : false;
}

async function sendMail(post, htmlFile) {
  const emailService = new EmailService();
  emailData.content = post.content;
  emailData.htmlContent = post.htmlContent;
  emailData.attachments.push(htmlFile);
  emailService.sendMail(emailData, true);
}

module.exports = {ebookSender};