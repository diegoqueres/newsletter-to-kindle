const test = require('tape');
const {Feed} = require('../app/models');
const Scrapper = require('../app/services/scrapper');
const DateUtils = require('../app/utils/date-utils');
const ValidationUtils = require('../app/utils/validation-utils');
require('dotenv').config();

test('Return correctly post of day', async (t) => {
    let feed = getFeedToTest();
    let scrapper = new Scrapper(feed);
    let posts = await scrapper.getPosts();

    posts.forEach((post, index) => assertValidPostOfDay(t, post, index));  
    t.end();  
});

test('Scrap post content correctly', async (t) => {
    let feed = getFeedToTest();
    let scrapper = new Scrapper(feed, true);

    let posts = await scrapper.getPosts();
    for (let i = 0; i < posts.length; i++) {
        let post = await scrapper.scrapPost(posts[i]); 
        assertScrapPostCorrectly(t, post, i, feed.getEncoding());
    }
    t.end(); 
});

function getFeedToTest() {
    /***********************************************************
     * BEFORE RUN/TEST PROJECT
    //Use your own feed object's for testing
    //while we doesn't have implemented mocks here
    return Feed.build({
        name: 'Demo Feed',
        url: 'https://www.demo.com/feed',
        updatePeriodicity: Feed.PERIODICITY.DAILY,
        author: 'Tom Jones',
        partial: true,
        subject: 'Tom Jones',
        locale: 'en-US',
        articleSelector: 'div.article',
        maxPosts: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    ************************************************************/
}

function assertScrapPostCorrectly(t, post, i, encoding) {
    t.assert( ValidationUtils.validNonEmptyString(post.content), `post ${i} has a content`);
    t.assert( ValidationUtils.validNonEmptyString(post.htmlContent), `post ${i} has a htmlContent`);
    t.assert( post.htmlContent.includes(`<meta charset="${encoding}">`), `post ${i} has a correctly encoding` );    
}

function assertValidPostOfDay(t, post, i) {
    t.assert( DateUtils.isSameDate(post.date, new Date()), `post ${i} date is today`);
    t.assert( ValidationUtils.validURL(post.link) , `post ${i} has a link`);
    t.assert( ValidationUtils.validNonEmptyString(post.title), `post ${i} has a title`);
    t.assert( ValidationUtils.validNonEmptyString(post.author), `post ${i} has an author`);
}
