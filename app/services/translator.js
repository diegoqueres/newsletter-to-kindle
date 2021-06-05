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
        this.subscriptionKey = process.env.TRANSLATOR_API_KEY;
        this.baseURL = process.env.TRANSLATOR_API_BASE_URL;
        this.translateEndpoint = process.env.TRANSLATOR_API_TRANSLATE_ENDPOINT;
        this.breakSentencesEndpoint = process.env.TRANSLATOR_API_BREAK_SENTENCES_ENDPOINT;        
        this.location = process.env.TRANSLATOR_API_LOCATION;
        this.charactersLimitPerRequest = process.env.TRANSLATOR_API_TRANSLATE_TEXT_CHARACTERS_LIMIT_PER_REQUEST;
        this.characterslimitTotal = process.env.TRANSLATOR_API_MAX_CHARACTERS;
    }

    async translateText(params) {
      const {text, sourceLang, targetLang} = params;
      params.plainText = sanitizeHtml(text, toPlainText);
      return await this.callApiToTextTranslate(params);
    }

    async translatePost(params) {
      const {text, sourceLang, targetLang, textFormat=Translator.TEXT_FORMAT.HTML} = params;

      this.validate(params);
      params.textArray = await this.breakSentences(params);
      let translatedPost = await this.callApiToPostTranslate(params);
      
      return translatedPost;
    }

    validate(params) {
      const {text, sourceLang, targetLang, textFormat=Translator.TEXT_FORMAT.HTML} = params;
      if (text.length > this.characterslimitTotal)
        throw new Error('Maximum character limit for translation exceeded');
      if (targetLang == null)
        throw new Error('Target lang cannot be null');
    }

    async breakSentences(params) {
      const {text, textFormat=Translator.TEXT_FORMAT.HTML} = params;
      let textTokens = null;

      switch (textFormat) {
        case Translator.TEXT_FORMAT.PLAIN_TEXT:
          textTokens = text.split(os.EOL);
          textTokens = textTokens.map(str => `${str}${os.EOL}`);
          break;
          
        case Translator.TEXT_FORMAT.HTML:
          let positions = await this.callApiToBreakentences({...params, text});
          textTokens = this.breakHtmlSentences(text, positions);
          break;
      }

      return this.breakTextToPackages(textTokens);
    }

    breakHtmlSentences(text, positions) {
      const regexEndSentence = /\<(\/(p|div|li|tr|pre)|br)\>\s*?$/i;
      let buffer = [], textTokens = [];
      let lastPos = 0;
      for (let i = 0; i < positions.length; i++) {
        let pos = positions[i];
        let textPiece = text.substring(lastPos, (pos+lastPos));
        buffer.push(textPiece);
        if (regexEndSentence.exec(textPiece) !== null) {
          textTokens.push(buffer.join(''));
          buffer = [];
        }
        lastPos += pos;
      }
      return textTokens;
    }

    breakTextToPackages(textTokens) {
      let textPackage = [], textPackages = [];
      let textPackageSize = 0;

      for (let token of textTokens) {
        if ((textPackageSize + token.length) > this.charactersLimitPerRequest) {
          textPackages.push(textPackage);
          textPackage = [];
          textPackageSize = 0;
        }
        textPackage.push(token);
        textPackageSize += token.length;
      }
      textPackages.push(textPackage);

      return textPackages;
    }

    async callApiToBreakentences(params) {
      const {text, sourceLang} = params;
      let convertedText = [{"Text": text}];

      return await unirest
        .post(`${this.baseURL}/${this.breakSentencesEndpoint}`)
        .headers({
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Ocp-Apim-Subscription-Region': this.location,
          'Content-type': 'application/json',
          'X-ClientTraceId': uuidv4().toString()
        })
        .query({
          "api-version": "3.0",
          "language": sourceLang
        })
        .type("json")
        .send(convertedText)
        .then((res) => {
          if (res.error) throw new Error(res.error);
          return res.body[0]['sentLen']
        });     
    }

    async callApiToPostTranslate(params) {
      const {textArray, sourceLang, targetLang, textFormat=Translator.TEXT_FORMAT.HTML} = params;

      let result = '';
      for (let i = 0; i < textArray.length; i++) {
        let convertedTextArray = textArray[i].map((textEl) => { return {"Text": textEl} });
        let response = await unirest
          .post(`${this.baseURL}/${this.translateEndpoint}`)
          .headers({
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Ocp-Apim-Subscription-Region': this.location,
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

      let response = await unirest
        .post(`${this.baseURL}/${this.translateEndpoint}`)
        .headers({
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Ocp-Apim-Subscription-Region': this.location,
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