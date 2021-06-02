const {Feed} = require('../app/models');
const Post = require('../app/entities/post');
const Scrapper = require('../app/services/scrapper');
const DateUtils = require('../app/utils/date-utils');
const ValidationUtils = require('../app/utils/validation-utils');
jest.mock('../app/services/scrapper');
require('dotenv').config();

let feed, scrapper, posts, scrappedPosts;


beforeAll(() => {
    feed = getFeedToTest();
    scrapper = new Scrapper(feed, true);
    initializeMocks();
});

function initializeMocks() {
    let mockInitialData = {
        title: 'The end is near',
        author: 'Sarah Connor',
        date: new Date(),
        link: 'https://www.sarahconnor.com/newsletter/the-end-is-near/',
        description: 'The unknown future rolls toward us.'
    };
    let mockPost = new Post(mockInitialData);
    scrapper.getPosts.mockResolvedValue([ mockPost ]);

    let mockScrappedPost = new Post(mockInitialData);
    mockScrappedPost.content = "The unknown future rolls toward us. I face it, for the first time, with a sense of hope. Because if a machine, a Terminator, can learn the value of human life, maybe we can too.";
    mockScrappedPost.htmlContent = "<!DOCTYPE html><html>\n<head>\n<title>The end is near</title><meta charset=\"Windows-1252\"><meta http-equiv=\"content-language\" content=\"en-US\"></head>\n<body>\n\n<article><header><h2 class=\"headline\">The end is near</h2>\n<div class=\"byline\"><a href=\"#\" rel=\"author\">Sarah Connor</a> | june, 1 2021</div>\n</header>\n<p>The unknown future rolls toward us. I face it, for the first time, with a sense of hope. Because if a machine, a Terminator, can learn the value of human life, maybe we can too.</p></article></body>\n</html>";
    scrapper.scrapPost.mockResolvedValue( mockScrappedPost );
}


describe('Return correctly post of day', () => {
    beforeAll(async() => {
        posts = await scrapper.getPosts();
    });

    test('post date is today', (done) => {
        posts.forEach((post, index) => {
            expect(DateUtils.isSameDate(post.date, new Date())).toBeTruthy();
        }); 
        done();
    });

    test('post has a link', (done) => {
        posts.forEach((post, index) => {
            expect(ValidationUtils.validURL(post.link)).toBeTruthy();
        });
        done();
    });

    test('post has a title', (done) => {
        posts.forEach((post, index) => {
            expect(ValidationUtils.validNonEmptyString(post.title)).toBeTruthy();
        });
        done();
    });

    test('post has an author', (done) => {
        posts.forEach((post, index) => {
            expect(ValidationUtils.validNonEmptyString(post.author)).toBeTruthy();
        });
        done();
    });
});


describe('Scrap post correctly', () => {
    beforeAll(async() => {
        jest.setTimeout(10000);
        scrappedPosts = [];
        posts = await scrapper.getPosts();
        posts.forEach(async(post) => {
            let scrappedPost = await scrapper.scrapPost(post);
            scrappedPosts.push(scrappedPost);
        }); 
    });

    test('post has a content', (done) => {
        scrappedPosts.forEach(post => expect(ValidationUtils.validNonEmptyString(post.content)).toBeTruthy());
        done();
    });

    test('post has a htmlContent', (done) => {
        scrappedPosts.forEach(post => expect(ValidationUtils.validNonEmptyString(post.htmlContent)).toBeTruthy());
        done();
    });

    test('post has a correctly encoding', (done) => {
        scrappedPosts.forEach(post => expect(post.htmlContent.includes(`<meta charset="${feed.getEncoding()}">`)).toBeTruthy());
        done();
    });
});


function getFeedToTest() {
    return Feed.build({
        name: 'Diary of the Apocalypse',
        url: 'https://www.sarahconnor.com/newsletter/feed',
        updatePeriodicity: Feed.PERIODICITY.DAILY,
        author: 'Sarah Connor',
        partial: true,
        subject: 'Articial Intelligence',
        locale: 'en-US',
        articleSelector: 'div.ath-article',
        maxPosts: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}