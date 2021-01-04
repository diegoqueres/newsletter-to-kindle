'use strict';
const {Feed} = require('../../app/models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Feeds', [
      /***********************************************************
       * BEFORE RUN/TEST PROJECT
       * //Insert your own feed object's to seed database (see the model bellow)
      {
        name: 'Demo Feed',
        url: 'https://www.demo.com/newsletters/feed',
        author: 'Tom Jones',
        partial: true,
        subject: 'Tom Jones',
        locale: 'en-US',
        articleSelector: 'div.article',
        maxPosts: 1,
        updatePeriodicity: Feed.PERIODICITY.DAILY,
        dayOfWeek: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      *********************************************************************************/
    ], {});   
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Feeds', null, {});
  }
};
