const Scrapper = require('../services/scrapper');
const EmailService = require('../services/email-service');
const TempWriter = require('../utils/temp-file-writer');
const ConversionUtils = require('../utils/conversion-utils');
const ValidationUtils = require('../utils/validation-utils');
const {Newsletter} = require('../models');
const emailData = require('../../config/email-data');

const ebookSender = async() => {
    try {
      const newsletters = await Newsletter.findAll({
        where: {active: true}
      });
      
      for (let newsletter of newsletters) {
        try {
          let scrapper = new Scrapper(newsletter, getDebug());
          let posts = await scrapper.getPosts();
          for (let post of posts) {
            post = await scrapper.scrapPost(post); 
            const htmlFile = 
              TempWriter.writeTempFileWithSubjectAndTitle(newsletter.subject, post.title, 'htm', post.htmlContent, newsletter.getEncoding());
            await sendMail(post, htmlFile);
          }
        } catch (err) {
          console.log(`Error when scrap feed ${newsletter.name} :${err}`);
        }
      };
    } catch (err) {
      console.log(err);
    }
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
  await emailService.sendMail(emailData, true);
}

module.exports = {ebookSender};