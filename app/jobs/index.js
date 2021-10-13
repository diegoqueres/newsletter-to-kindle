const {ebookSender} = require('./ebook-sender');
const {jobLogger} = require('../../config/logger');
require('dotenv').config();

(async () => {
  jobLogger.info('Starting scheduled jobs...');

  ebookSender()
    .then(() => {
      jobLogger.info('Newsletter job has finished');
    })
    .catch((error) => {
      jobLogger.error('Newsletter job failed while running: ' + error);
    });
})();