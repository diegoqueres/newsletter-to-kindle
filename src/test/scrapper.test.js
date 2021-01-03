const test = require('tape');
const Scrapper = require('../scrapper');
const DateUtils = require('../utils/date-utils');
const ValidationUtils = require('../utils/validation-utils');
require('dotenv').config();

test('Return correctly post of day', async (t) => {
    let scrapper = new Scrapper(process.env.POST_WEB_CONTENT_SELECTOR);
    let post = await scrapper.getPostOfDay(process.env.FEED_URL, process.env.POST_PERIODICITY);

    assertValidPostOfDay(t, post);
});


test('Scrap post content correctly', async (t) => {
    let scrapper = new Scrapper(web_content_selector=process.env.POST_WEB_CONTENT_SELECTOR, debug=true);
    const encoding = 'Windows-1252';

    let post = await scrapper.getPostOfDay(process.env.FEED_URL, process.env.POST_PERIODICITY);
    post = await scrapper.scrapPost(post, encoding);
    
    assertScrapPostCorrectly(t, post, encoding);
});

function assertScrapPostCorrectly(t, post, encoding) {
    t.assert( ValidationUtils.validNonEmptyString(post.content), 'has a content');
    t.assert( ValidationUtils.validNonEmptyString(post.htmlContent), 'has a htmlContent');
    t.assert( post.htmlContent.includes(`<meta charset="${encoding}">`), 'has a correctly encoding' );    
    t.end();
}

function assertValidPostOfDay(t, post) {
    t.assert( DateUtils.isSameDate(post.date, new Date()), 'date is today');
    t.assert( ValidationUtils.validURL(post.link) , 'has a link');
    t.assert( ValidationUtils.validNonEmptyString(post.title), 'has a title');
    t.assert( ValidationUtils.validNonEmptyString(post.author), 'has an author');
    t.end();
}
