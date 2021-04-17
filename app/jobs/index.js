const {ebookSender} = require('./ebook-sender');
require('dotenv').config();

(async () => {
  console.log('Starting jobs...');

  await ebookSender();

  console.log('Jobs has finished...');

})();