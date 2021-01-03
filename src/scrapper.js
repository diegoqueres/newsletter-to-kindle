const puppeteer = require('puppeteer');
const random = require('random');
const Parser = require('rss-parser');
const Post = require('./post');
const DateUtils = require('./utils/date-utils');
const ValidationUtils = require('./utils/validation-utils');

class Scrapper {
    static timeoutMin = 30 * 1000;
    static timeoutMax = 90 * 1000;

    constructor(web_content_selector = null, debug = false){
        this.debug = debug;
        this.web_content_selector = web_content_selector;
        this.browser = null;
        this.page = null;
    }

    async initBrowser() {
        this.browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        this.page = await this.browser.newPage();
    }

    async getPostOfDay(feedUrl, periodicity) {
        let parser = new Parser();
        let feed = await parser.parseURL(feedUrl);
        let feedItem = this.getFeedItemByPeriodicity(feed, periodicity);
        return new Post({   
            title: feedItem.title, 
            author: ValidationUtils.validNonEmptyString(feedItem.author) ? feedItem.author : feedItem.creator, 
            date: feedItem.date, 
            link: feedItem.link, 
            description: feedItem.contentSnippet, 
            periodicity: periodicity
        });
    }

    getFeedItemByPeriodicity(feed, periodicity) {
        let feedItems = [];
        switch (periodicity) {
            case Post.PERIODICITY.DAILY:
                let today = new Date();
                feedItems = feed.items.filter((item) => {
                    item.date = new Date(item.isoDate);
                    return DateUtils.isSameDate( item, today );
                }); 

            case Post.PERIODICITY.LAST:
            default:
                let feedItem = feed.items.reduce((prev, current) => {
                    prev.date = new Date(prev.isoDate);
                    current.date = new Date(current.isoDate);
                    return (prev.date > current.date) ? prev : current;
                }); 
                if (feedItem != null) feedItems.push(feedItem);           
        }
                        
        if (feedItems.length == 0) throw new Error(`There is no results in feed`);
        return feedItems[0];
    }

    async scrapPost(post, htmlEncoding = 'UTF-8') {
        if (ValidationUtils.validNonEmptyString(post.content))
            return post;

        const {content, htmlContent} = await this.scrapPostByUrl(post.link);
        post.content = content;
        post.htmlContent = `<html>\n<head>\n`;
        post.htmlContent += `<title>${post.title}</title>`;
        post.htmlContent += `<meta charset="${htmlEncoding}">`;
        post.htmlContent += `<meta http-equiv="Content-Language" content="pt-br">`;
        post.htmlContent += `<meta name="description" content="${post.description}">`;
        post.htmlContent += `<meta name="author" content="${post.author}">`;
        post.htmlContent += `</head>\n<body>\n\n`;
        post.htmlContent += `<article>`;
        post.htmlContent += `<header>`;
        post.htmlContent += `<h2 class="headline">${post.title}</h2>\n`;
        post.htmlContent += `<div class="byline"><a href="#" rel="author">${post.author}</a> | ${post.date.toLocaleDateString('pt-BR')}</div>\n`;
        post.htmlContent += `</header>`;
        post.htmlContent += `${htmlContent}\n<hr>\n`;
        post.htmlContent += `<p><em><strong>Autor: </strong>${post.author}</em><br />`;
        post.htmlContent += `<em><strong>Fonte: </strong>${post.link}</em></p>`;
        post.htmlContent += `</article>`;
        post.htmlContent += `</body>\n</html>`;
        
        return post;
    }

    async scrapPostByUrl(postUrl) {
        await this.initBrowser();
        await this.navigateToPage(postUrl);
 
        const result = {
            content: await this.page.$eval(this.web_content_selector, node => node.innerText),
            htmlContent: await this.page.$eval(this.web_content_selector, node => node.innerHTML)
        }

        await this.close();
        
        return result;
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