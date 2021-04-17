const Scrapper = require('../services/scrapper');
const EmailSender = require('../services/email-sender');
const TempWriter = require('../utils/temp-file-writer');
const ConversionUtils = require('../utils/conversion-utils');
const ValidationUtils = require('../utils/validation-utils');
const {Feed} = require('../models');
const emailData = require('../../config/email-data');

const ebookSender = async() => {
    try {
      const feeds = await Feed.findAll({
        where: {active: true}
      });
      
      for (let feed of feeds) {
        try {
          let scrapper = new Scrapper(feed, getDebug());
          let posts = await scrapper.getPosts();
          for (let post of posts) {
            post = await scrapper.scrapPost(post); 
            const htmlFile = 
              TempWriter.writeTempFileWithSubjectAndTitle(feed.subject, post.title, 'htm', post.htmlContent, feed.getEncoding());
            await sendMail(post, htmlFile);
          }
        } catch (err) {
          console.log(`Error when scrap feed ${feed.name} :${err}`);
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
  const emailSender = new EmailSender();
  emailData.content = post.content;
  emailData.htmlContent = post.htmlContent;
  emailData.attachments.push(htmlFile);
  await emailSender.sendMail(emailData, true);
}

module.exports = {ebookSender};