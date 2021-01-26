const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const os = require('os');
const unirest = require('unirest');
const { v4: uuidv4 } = require('uuid');
const sanitizeHtml = require('sanitize-html');
const toPlainText = {
  allowedTags: [],
  allowedAttributes: {}
};
require('dotenv').config();

class Translator {
    static MODE = {
        FULL: 1,
        BILINGUAL: 2
    }
    static TEXT_FORMAT = {
        HTML: 'html',
        PLAIN_TEXT: 'plain'
    }

    constructor(mode) {
        this.mode = mode;
    }

    async translatePost(params) {
      const {text, sourceLang, targetLang, textFormat=Translator.TEXT_FORMAT.HTML} = params;
      const plainText = sanitizeHtml(text, toPlainText); 
      const textLimit = process.env.TRANSLATOR_API_TEXT_LIMIT_PER_REQUEST;

      let textTokens = [], textArray = [];
      switch (textFormat) {
        case Translator.TEXT_FORMAT.PLAIN_TEXT:
          textTokens = text.split(os.EOL);
          textTokens = textTokens.map(str => `${str}${os.EOL}`);
          break;
        case Translator.TEXT_FORMAT.HTML:
          let dom = new JSDOM(text);
          let htmlParagraphs = dom.window.document.querySelectorAll('p');
          for (let htmlParagraph of htmlParagraphs) {
            textTokens.push(htmlParagraph.outerHTML);
          }
          break;
      }

      let buffer = [], bufferSize = 0;
      for (let token of textTokens) {
        if ((bufferSize + token.length) > textLimit) {
          textArray.push(buffer);
          buffer = new Array();
          bufferSize = 0;
        }
        buffer.push(token);
        bufferSize += token.length;
      }
      textArray.push(buffer);

      params.textArray = textArray;
      return await this.callApiToPostTranslate(params);
    }

    async translateText(params) {
      const {text, sourceLang, targetLang} = params;
      params.plainText = sanitizeHtml(text, toPlainText);
      return await this.callApiToTextTranslate(params);
    }

    async callApiToPostTranslate(params) {
      const {textArray, sourceLang, targetLang, textFormat=Translator.TEXT_FORMAT.HTML} = params;
      const subscriptionKey = process.env.TRANSLATOR_API_KEY;
      const baseURL = process.env.TRANSLATOR_API_BASE_URL;
      const endPoint = process.env.TRANSLATOR_API_TRANSLATE_ENDPOINT;
      const location = process.env.TRANSLATOR_API_LOCATION;

      let result = '';
      for (let i = 0; i < textArray.length; i++) {
        let convertedTextArray = textArray[i].map((textEl) => { return {"Text": textEl} });
        let response = await unirest
          .post(`${baseURL}/${endPoint}`)
          .headers({
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Ocp-Apim-Subscription-Region': location,
            'Content-type': 'application/json',
            'X-ClientTraceId': uuidv4().toString()
          })
          .query({
            "api-version": "3.0",
            "to": targetLang,
            "from": sourceLang,
            "textType": textFormat
          })
          .type("json")
          .send(convertedTextArray)
          .then((res) => {
            if (res.error) throw new Error(res.error);
            if (this.mode == Translator.MODE.BILINGUAL) {
              let resp = '';
              for (let j = 0; j < textArray[i].length; j++) {
                let originalText = textArray[i][j];
                let translatedText = res.body[j].translations[0].text;
                resp += `${originalText}${translatedText}`;
              }
              return resp;
            } else {
              return res.body.reduce((concat, el) => concat += el.translations[0].text, '');
            }
          });   
        result += response;
      }

      return result;
    }

    async callApiToTextTranslate(params) {
      const {plainText, sourceLang, targetLang} = params;
      const subscriptionKey = process.env.TRANSLATOR_API_KEY;
      const baseURL = process.env.TRANSLATOR_API_BASE_URL;
      const endPoint = process.env.TRANSLATOR_API_TRANSLATE_ENDPOINT;
      const location = process.env.TRANSLATOR_API_LOCATION;

      let response = await unirest
        .post(`${baseURL}/${endPoint}`)
        .headers({
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Ocp-Apim-Subscription-Region': location,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4().toString()
        })
        .query({
          "api-version": "3.0",
          "to": targetLang,
          "from": sourceLang,
          "textType": Translator.TEXT_FORMAT.PLAIN_TEXT
        })
        .type("json")
        .send([{"Text": plainText}])
        .then((res) => {
          if (res.error) throw new Error(res.error);
          return res.body.reduce((concat, el) => concat += el.translations[0].text, '');
        });   

      return response;
    }    
}
module.exports = Translator;