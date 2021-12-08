require('dotenv').config();
const NewsletterSenderJob = require('./newsletter-sender-job');
const {jobLogger} = require('../../config/logger');

(async () => {
  jobLogger.info('Scheduled jobs started');

  const newsletterSenderJob = new NewsletterSenderJob();
  const job1 = newsletterSenderJob.sendNewsletters()
    .then(() => {
      jobLogger.info('Newsletter job has finished');
    })
    .catch((error) => {
      jobLogger.error('Newsletter job failed while running: ' + error);
    }); 
    
  Promise.allSettled([job1])
    .then((result) => {
      jobLogger.info('Scheduled jobs has finished');
    });
})();