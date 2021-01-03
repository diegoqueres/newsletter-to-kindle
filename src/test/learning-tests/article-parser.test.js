const test = require('tape');
const ValidationUtils = require('../../utils/validation-utils');
const Scrapper = require('../../scrapper');
const {extract} = require('article-parser');
require('dotenv').config();

const getArticle = async (url) => {
    try {
      const article = await extract(url);
      return article;
    } catch (err) {
      console.trace(err);
    }
};
   
test('Get article content correctly', async (t) => {
    let scrapper = new Scrapper(process.env.POST_WEB_CONTENT_SELECTOR);
    let post = await scrapper.getPostOfDay(process.env.FEED_URL, process.env.POST_PERIODICITY);
    let feedItemUrl = post.link;
    let articleContent = await getArticle(feedItemUrl);
    console.log(articleContent);

    t.assert( ValidationUtils.validNonEmptyString(feedItemUrl), 'feed url is valid');
    t.assert( ValidationUtils.validNonEmptyString(articleContent), 'content is not empty');
    t.assert( articleContent.includes('Do que mais você precisa?'), 'has fully content');
    t.end();
});