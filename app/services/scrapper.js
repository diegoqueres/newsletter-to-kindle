const puppeteer = require('puppeteer');
const random = require('random');
const sanitizeHtml = require('sanitize-html');
const Parser = require('rss-parser');
const path = require('path');
const { I18n } = require('i18n');
const Post = require('../entities/post');
const DateUtils = require('../utils/date-utils');
const ValidationUtils = require('../utils/validation-utils');
const {Feed} = require('../models');

class Scrapper {
    static timeoutMin = 30 * 1000;
    static timeoutMax = 90 * 1000;

    constructor(feed = null, debug = false){
        this.debug = debug;
        this._feed = feed;
        this.browser = null;
        this.page = null;
        this.#initI18N();
    }

    get feed() {
        return this._feed;
    }
    set feed(feed) {
        this._feed = feed;
    }

    #initI18N() {
        this.i18n = new I18n();
        this.i18n.configure({
            defaultLocale: this.feed.locale.substr(0,2),
            fallbacks: [
                { nl: 'en', 'en-*': 'en' },
                { nl: 'pt', 'pt-*': 'pt' },
            ],
            directory: path.join(__dirname, '../../locales')
        });   
    }

    async initBrowser() {
        this.browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        this.page = await this.browser.newPage();
    }

    async getPosts() {
        let parser = new Parser();
        let sourceFeed = await parser.parseURL(this.feed.url);
        let feedItems = this.getFeedItems(sourceFeed);

        let posts = [];
        feedItems.forEach((feedItem) => {
            let post = new Post({   
                title: feedItem.title, 
                author: ValidationUtils.validNonEmptyString(feedItem.author) ? feedItem.author : feedItem.creator, 
                date: feedItem.date, 
                link: feedItem.link, 
                description: feedItem.contentSnippet
            });
            if (!this.feed.partial) {
                post.content = sanitizeHtml(feedItem["content:encoded"], {
                    allowedTags: [],
                    allowedAttributes: {}
                });  
                post.htmlContent = feedItem["content:encoded"];
            }
            posts.push(post);
        });

        return posts;
    }

    getFeedItems(sourceFeed) {
        let feedItems = this.#getFeedItemsByPeriodicity(sourceFeed);
        if (feedItems.length == 0) return feedItems;

        feedItems = this.#removeDuplicateFeedItems(feedItems);
        feedItems = this.#limitFeedItemsToMax(feedItems);
                
        return feedItems;
    }

    #getFeedItemsByPeriodicity(sourceFeed) {
        let today = new Date();
        let feedItems = [];

        switch (this.feed.updatePeriodicity) {
            case Feed.PERIODICITY.DAILY:
                feedItems = sourceFeed.items.filter((item) => {
                    item.date = new Date(item.isoDate);
                    return DateUtils.isSameDate( today, item.date );
                }); 
                break;

            case Feed.PERIODICITY.WEEKLY:
                feedItems = sourceFeed.items.filter((item) => {
                    item.date = new Date(item.isoDate);
                    return (DateUtils.isDateInThisWeek(item.date) && (this.feed.dayOfWeek == today.getDay()));
                }); 
                break;

            case Feed.PERIODICITY.LAST:
            default:
                let feedItem = sourceFeed.items.reduce((prev, current) => {
                    prev.date = new Date(prev.isoDate);
                    current.date = new Date(current.isoDate);
                    return (prev.date > current.date) ? prev : current;
                }); 
                if (feedItem != null) feedItems.push(feedItem);   
                break;        
        }

        return feedItems;
    }

    #removeDuplicateFeedItems(feedItems) {
        return Array.from(new Set(feedItems.map(a => a.postUrl)))
            .map(postUrl => {
                return feedItems.find(a => a.postUrl === postUrl)
            });        
    }

    #limitFeedItemsToMax(feedItems) {
        return feedItems.slice(0, this.feed.maxPosts);
    }

    async scrapPost(post) {
        if (!ValidationUtils.validNonEmptyString(post.content)) {
            let {content, htmlContent} = await this.scrapPostByUrl(post.link);
            post.content = content;
            post.htmlContent = htmlContent;
        }

        let newHtmlContent = `<html>\n<head>\n`;
        newHtmlContent += `<title>${post.title}</title>`;
        newHtmlContent += `<meta charset="${this.feed.getEncoding()}">`;
        newHtmlContent += `<meta http-equiv="Content-Language" content="${this.feed.language}">`;
        newHtmlContent += `<meta name="description" content="${post.description}">`;
        newHtmlContent += `<meta name="author" content="${post.author}">`;
        newHtmlContent += `</head>\n<body>\n\n`;
        newHtmlContent += `<article>`;
        newHtmlContent += `<header>`;
        newHtmlContent += `<h2 class="headline">${post.title}</h2>\n`;
        newHtmlContent += `<div class="byline"><a href="#" rel="author">${post.author}</a> | ${post.date.toLocaleDateString(this.feed.locale)}</div>\n`;
        newHtmlContent += `</header>`;
        newHtmlContent += `${post.htmlContent}\n<hr>\n`;
        newHtmlContent += `<p><em><strong>${this.i18n.__('Author')}: </strong>${post.author}</em><br />`;
        newHtmlContent += `<em><strong>${this.i18n.__('Source')}: </strong>${post.link}</em></p>`;
        newHtmlContent += `</article>`;
        newHtmlContent += `</body>\n</html>`;
        post.htmlContent = newHtmlContent;
        
        return post;
    }

    async scrapPostByUrl(postUrl) {
        await this.initBrowser();
        await this.navigateToPage(postUrl);
 
        let content = await this.page.$eval(this.feed.articleSelector, node => node.innerText);
        let htmlContent = sanitizeHtml(
            await this.page.$eval(this.feed.articleSelector, node => node.innerHTML)
        );  
        // When we learn more about attaching images to the Kindle-To-Email service, we will allow <img> tags
        // let htmlContent = await this.page.$eval(this.feed.articleSelector, node => node.innerHTML);
        // htmlContent = sanitizeHtml(htmlContent, {
        //     allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ])
        // });

        await this.close();
        
        return {content, htmlContent};
    }

    async navigateToPage(url) {
        if (this.debug) {
            await this.page.goto(url);
            return;
        }
        await this.page.goto(url, {timeout: Scrapper.timeoutMax});
        await this.page.waitForTimeout(random.int(Scrapper.timeoutMin, Scrapper.timeoutMax)); 
    }

    async close() {
        await this.browser.close();
    }
}
module.exports = Scrapper;