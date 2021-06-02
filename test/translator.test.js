const fs = require('fs');
const Translator = require('../app/services/translator');
jest.mock('../app/services/translator');

let text, sourceLang, targetLang, result;


describe('Test post translator call', () => {
    beforeAll(async() => {
        text = '<p>Hello world!</p>';
        sourceLang = 'en-US';
        targetLang = 'pt-BR';
        const translator = new Translator(Translator.MODE.FULL);
        const translateParams = {text, sourceLang, targetLang, textFormat: Translator.TEXT_FORMAT.HTML};

        translator.translatePost.mockResolvedValue('<p>Olá, mundo!</p>');
        result = await translator.translatePost(translateParams);
    });

    test('it is returning non empty result', (done) => {
        expect(result.length > 0).toBeTruthy();
        done();
    });

    test('it is translating correctly', (done) => {
        expect(result).toBe('<p>Olá, mundo!</p>');
        done();
    });
});


describe('Test text translate', () => {
    beforeAll(async() => {
        text = 'Hello!';
        sourceLang = 'en-US';
        targetLang = 'fr';
        const translator = new Translator(Translator.MODE.FULL);
        const translateParams = {text, sourceLang, targetLang};

        translator.translateText.mockResolvedValue('Bonjour!');
        result = await translator.translateText(translateParams);
    });

    test('it is returning non empty result', (done) => {
        expect(result.length > 0).toBeTruthy();
        done();
    });

    test('it is translating correctly', (done) => {
        expect(result).toBe('Bonjour!');
        done();
    });
});


describe('Test translator to long texts', () => {
    beforeAll(async() => {
        text = fs.readFileSync('test/files/alice-long-paragraph.txt', 'utf8');
        sourceLang = 'en-US';
        targetLang = 'pt-BR';
        const translator = new Translator(Translator.MODE.FULL);
        const translateParams = {text, sourceLang, targetLang, textFormat: Translator.TEXT_FORMAT.PLAIN_TEXT};

        //Mock config
        let translatedPost = fs.readFileSync('test/files/alice-long-paragraph-ptBR.txt', 'utf8');
        translator.translatePost.mockResolvedValue(translatedPost);

        result = await translator.translatePost(translateParams);
    });

    test('it is returning non empty result', (done) => {
        expect(result.length > 0).toBeTruthy();
        done();
    });

    test('it is returning text without truncating', (done) => {
        expect(result.length).toBeGreaterThanOrEqual(9171);
        done();
    });

    test('it is translating correctly', (done) => {
        let translatedText = fs.readFileSync('test/files/alice-first-paragraph-ptBR.txt', 'utf8');
        expect(result).toMatch(translatedText);
        done();
    });
});


describe('Test translator to long html texts', () => {
    beforeAll(async() => {
        text = fs.readFileSync('test/files/alice-long-paragraph.html', 'utf8');
        sourceLang = 'en-US';
        targetLang = 'pt-BR';
        const translator = new Translator(Translator.MODE.FULL);
        const translateParams = {text, sourceLang, targetLang, textFormat: Translator.TEXT_FORMAT.HTML};

        //Mock config
        let translatedText = fs.readFileSync('test/files/alice-long-paragraph-ptBR.html', 'utf8');
        let translatedPost = `<p>${translatedText}</p>`;
        translator.translatePost.mockResolvedValue(translatedPost);

        result = await translator.translatePost(translateParams);
    });

    test('it is returning non empty result', (done) => {
        expect(result.length > 0).toBeTruthy();
        done();
    });

    test('it is returning text without truncating', (done) => {
        expect(result.length).toBeGreaterThanOrEqual(9119);
        done();
    });

    test('it is translating correctly', (done) => {
        let translatedText = fs.readFileSync('test/files/alice-first-paragraph-ptBR.txt', 'utf8');
        translatedText = `<p>${translatedText}</p>`;
        expect(result).toMatch(translatedText);
        done();
    });
});


describe('Test bilingual translate', () => {
    beforeAll(async() => {
        text = fs.readFileSync('test/files/alice-short-paragraph.html', 'utf8');
        sourceLang = 'en-US';
        targetLang = 'pt-BR';
        const translator = new Translator(Translator.MODE.BILINGUAL);
        const translateParams = {text, sourceLang, targetLang, textFormat: Translator.TEXT_FORMAT.HTML};

        //Mock config
        let translatedPost = fs.readFileSync('test/files/alice-bilingual-short-paragraph.html', 'utf8');
        translator.translatePost.mockResolvedValue(translatedPost);

        result = await translator.translatePost(translateParams);
    });

    test('it is returning non empty result', (done) => {
        expect(result.length > 0).toBeTruthy();
        done();
    });

    test('it is translating corretly', (done) => {
        expect(result).toMatch(/\<p\>Alice estava começando a se cansar de sentar-se ao lado da irmã no banco, e de não ter nada para fazer/);
        done();
    });

    test('it is in bilingual format', (done) => {
        const regex = /\<p\>In another moment down went Alice after it.*\<p\>Em outro momento\, Alice depois dele/gmis;
        expect(result).toMatch(regex);
        done();
    });
});


describe('Test breaksentence endpoint', () => {
    beforeAll(async() => {
        text = fs.readFileSync('test/files/alice-short-paragraph.html', 'utf8');
        sourceLang = 'en-US';
        const translator = new Translator(Translator.MODE.BILINGUAL);
        
        //Mock config
        let jsonToConvert = fs.readFileSync('test/files/alice-short-paragraph-break-sentences.json', 'utf8');
        let json = JSON.parse(jsonToConvert);
        translator.callApiToBreakentences.mockResolvedValue(json);
        
        result = await translator.callApiToBreakentences({text, sourceLang});
    });

    test('it is returning non empty result', (done) => {
        expect(result.length > 0).toBeTruthy();
        done();
    });

    test('it is returning correctly first paragraph length', (done) => {
        expect(result[0]).toBe(310);
        done();
    });

    test('it is returning correctly second paragraph length', (done) => {
        expect(result[1]).toBe(5);
        done();
    });
});
