const puppeteer = require('puppeteer');
const random = require('random');
const sanitizeHtml = require('sanitize-html');
const Parser = require('rss-parser');
const path = require('path');
const { I18n } = require('i18n');
const { JSDOM } = require('jsdom');
const Post = require('../models/post');
const DateUtils = require('../utils/date-utils');
const ValidationUtils = require('../utils/validation-utils');
const ConversionUtils = require('../utils/conversion-utils');
const ImgUtils = require('../utils/img-utils');
const {Newsletter} = require('../models');
const Translator = require('./translator');
const loadTimeout = 30 * 1000;
require('dotenv').config();

class Scrapper {
    constructor(newsletter = null){
        this._newsletter = newsletter;
        this.browser = null;
        this.page = null;
        this.initI18N();
    }

    get newsletter() {
        return this._newsletter;
    }
    set newsletter(newsletter) {
        this._newsletter = newsletter;
    }

    initI18N() {
        this.i18n = this.getNewI18N(this.newsletter.locale);
    }

    getNewI18N(locale) {
        let i18n = new I18n();
        i18n.configure({
            defaultLocale: locale.substr(0,2),
            fallbacks: [
                { nl: 'en', 'en-*': 'en' },
                { nl: 'pt', 'pt-*': 'pt' },
            ],
            directory: path.join(__dirname, '../../locales')
        });   
        return i18n;
    }

    async initBrowser() {
        this.browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        this.page = await this.browser.newPage();
    }

    async getPosts() {
        let parser = new Parser();
        let sourceFeed = await parser.parseURL(this.newsletter.feedUrl);
        let feedItems = this.getFeedItems(sourceFeed);

        let posts = new Array();

        for (const feedItem of feedItems) {
            const post = new Post({   
                title: feedItem.title, 
                author: ValidationUtils.validNonEmptyString(feedItem.author) ? feedItem.author : feedItem.creator, 
                date: feedItem.date, 
                link: feedItem.link, 
                description: feedItem.contentSnippet
            });

            if (!this.newsletter.partial) {
                let htmlContent = feedItem["content:encoded"] 
                post.content = ConversionUtils.htmlToPlainText(htmlContent);    
                
                if (this.newsletter.includeImgs) {
                    const jsDom = new JSDOM(htmlContent);
                    const elements = jsDom.window.document.querySelectorAll("img[src^='http']");
                    for (let i=0; i<elements.length; i++){
                        elements[i].src = await ImgUtils.toBase64(elements[i].src);
                    }
                    htmlContent = jsDom.serialize();
                }

                post.htmlContent = sanitizeHtml(htmlContent, {
                    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]),
                    allowedSchemesByTag: { img: [ 'data' ]},
                    transformTags: {
                        img(tagName, attribs) {
                            const tag = {tagName, attribs, shouldMerge: true};
                            if (typeof tag.attribs['alt'] === 'undefined' || tag.attribs['alt'] === '')
                                tag.attribs['alt'] = 'presentation';
                            return tag;
                        }
                    }
                });
            }
            posts.push(post);
        }

        return posts;
    }
    

    getFeedItems(sourceFeed) {
        let feedItems = this.getFeedItemsByPeriodicity(sourceFeed);
        if (feedItems.length == 0) return feedItems;

        feedItems = this.removeDuplicateFeedItems(feedItems);
        feedItems = this.limitFeedItemsToMax(feedItems);
                
        return feedItems;
    }

    getFeedItemsByPeriodicity(sourceFeed) {
        let today = new Date();
        let feedItems = [];

        switch (this.newsletter.updatePeriodicity) {
            case Newsletter.PERIODICITY.DAILY:
                feedItems = sourceFeed.items.filter((item) => {
                    item.date = new Date(item.isoDate);

                    if (this.newsletter.getDaysOfWeek().length === 0)
                        return DateUtils.isSameDate(today, item.date);
                    else
                        return (DateUtils.isSameDate(today, item.date) 
                                    && this.newsletter.getDaysOfWeek().some((day) => day === today.getDay()));
                }); 
                break;

            case Newsletter.PERIODICITY.WEEKLY:
                feedItems = sourceFeed.items.filter((item) => {
                    item.date = new Date(item.isoDate);
                    return (DateUtils.isDateInThisWeek(item.date) 
                                && this.newsletter.getDaysOfWeek().some((day) => day === today.getDay()));
                }); 
                break;

            case Newsletter.PERIODICITY.LAST:
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

    removeDuplicateFeedItems(feedItems) {
        return Array.from(new Set(feedItems.map(a => a.postUrl)))
            .map(postUrl => {
                return feedItems.find(a => a.postUrl === postUrl)
            });        
    }

    limitFeedItemsToMax(feedItems) {
        return feedItems.slice(0, this.newsletter.maxPosts);
    }

    async scrapPost(post) {
        if (this.newsletter.mustBeScrapped()) {
            let {content, htmlContent} = await this.scrapPostByUrl(post.link);
            post.content = content;
            post.htmlContent = htmlContent;
        }

        let locale = this.newsletter.locale;
        let lang = locale;
        let labelAuthor = this.i18n.__('label.post.author');
        let labelSource = this.i18n.__('label.post.source');

        if (this.newsletter.mustBeTranslated()) {
            post = await this.translatePost(post);
            lang += `, ${this.newsletter.translationTarget}`;
            if (this.newsletter.translationMode == Translator.MODE.FULL) {
                locale = this.newsletter.translationTarget;
                lang = locale;
                let i18n = this.getNewI18N(locale);
                labelAuthor = i18n.__('label.post.author');
                labelSource = i18n.__('label.post.source');                
            }
        }

        post.htmlContent = this.generateHtmlContent({post, lang, labelAuthor, labelSource, locale});
        return post;
    }

    async translatePost(post) {
        const translator = new Translator(this.newsletter.translationMode);
        const translateParams = {
            text: null, 
            sourceLang: this.newsletter.locale, 
            targetLang: this.newsletter.translationTarget, 
            textFormat: null
        };

        //Translate article title
        translateParams.text = post.title;
        if (translator.mode == Translator.MODE.BILINGUAL)
            post.originalTitle = post.title;
        post.title = await translator.translateText(translateParams);

        //Translate text content
        if (process.env.TRANSLATOR_API_REDUCE_API_REQUESTS !== 'true') {
            translateParams.text = post.content;
            translateParams.textFormat = Translator.TEXT_FORMAT.PLAIN_TEXT;
            post.content = await translator.translatePost(translateParams);
        }

        //Translate html content
        translateParams.text = post.htmlContent;
        translateParams.textFormat = Translator.TEXT_FORMAT.HTML;
        post.htmlContent = await translator.translatePost(translateParams);

        return post;
    }

    generateHtmlContent(params) {
        const {post, lang, labelAuthor, labelSource, locale} = params;

        let newHtmlContent = `<html>`;
        newHtmlContent += `<head>`;
        newHtmlContent += `<title>${post.title}</title>`;
        newHtmlContent += `<meta http-equiv="content-type" content="text/html; charset=${this.newsletter.getEncoding()}">`;
        newHtmlContent += `<meta http-equiv="content-language" content="${lang}">`;
        newHtmlContent += `<meta name="author" content="${post.author}">`;
        newHtmlContent += `</head>\n`;
        newHtmlContent += `<body>`;
        newHtmlContent += `<article>`;
        newHtmlContent += `<header>`;
        if (ValidationUtils.validNonEmptyString(post.originalTitle))
            newHtmlContent += `<h2 class="headline">${post.originalTitle}</h1>\n`;
        newHtmlContent += `<h2 class="headline">${post.title}</h2>\n`;
        newHtmlContent += `<div class="byline"><a href="#" rel="author">${post.author}</a> | ${post.date.toLocaleDateString(locale, {dateStyle:"long"})}</div>\n`;
        newHtmlContent += `</header>`;
        newHtmlContent += `${post.htmlContent}\n<hr>\n`;
        newHtmlContent += `</article>`;
        newHtmlContent += `<footer>`
        newHtmlContent += `<p><em><strong>${labelAuthor}: </strong>${post.author}</em><br />`;
        newHtmlContent += `<em><strong>${labelSource}: </strong><a href="${post.link}">${post.link}</a></em><br />`;

        return newHtmlContent;
    }

    async scrapPostByUrl(postUrl) {
        await this.initBrowser();
        await this.navigateToPage(postUrl);
 
        const content = await this.page.$eval(this.newsletter.articleSelector, node => node.innerText);
        let htmlContent = null;

        if (this._newsletter.includeImgs) {
            await this.manipulatePageToConvertImgsToBase64(this.newsletter.articleSelector);
            htmlContent = sanitizeHtml(await this.page.$eval(this.newsletter.articleSelector, node => node.innerHTML), {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'figure' ]),
                allowedSchemesByTag: { img: [ 'data' ]}
            });
        } else {
            htmlContent = sanitizeHtml(await this.page.$eval(this.newsletter.articleSelector, node => node.innerHTML));
        }
        
        await this.close();
        
        return {content, htmlContent};
    }

    async manipulatePageToConvertImgsToBase64(selector) {
        await this.page.evaluate((sel) => {
            let c = document.createElement('canvas');
            let imgs = document.querySelectorAll(sel + ' img');
            for (let img of imgs) {
                c.height = img.naturalHeight;
                c.width = img.naturalWidth;

                let ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0, c.width, c.height);

                const base64String = c.toDataURL();
                img.src = base64String;
            }
        }, selector);        
    }

    async navigateToPage(url) {
        await this.page.goto(url, {timeout: loadTimeout, waitUntil: 'networkidle2'});
    }

    async close() {
        await this.browser.close();
    }
}
module.exports = Scrapper;