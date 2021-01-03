const Scrapper = require('./scrapper');
const EmailSender = require('./email-sender');
const TempWriter = require('./utils/temp-file-writer');
const Post = require('./post');
const emailData = require('./email-data');
const { htmlContent } = require('./email-data');
require('dotenv').config();

(async () => {
  console.log('Start application...');

  try {
    let scrapper = new Scrapper(process.env.POST_WEB_CONTENT_SELECTOR);
    let post = await scrapper.getPostOfDay(process.env.FEED_URL, process.env.POST_PERIODICITY);
    post = await scrapper.scrapPost(post, 'Windows-1252'); 
    let subject = process.env.POST_SUBJECT;
    const file = TempWriter.writeTempFileWithSubjectAndTitle(subject, post.title, 'htm', post.htmlContent, 'Windows-1252');

    const emailSender = new EmailSender();
    emailData.content = post.content;
    emailData.htmlContent = post.htmlContent;
    emailData.attachments.push(file);

    await emailSender.sendMail(emailData, true);

  } catch (err) {
    console.log(err);
  }

})();