const path = require('path');
const { I18n } = require('i18n');

const i18nConfig = {
    defaultLocale: 'en',
    locales: ['en', 'pt'],
    fallbacks: [
        { nl: 'en', 'en-*': 'en' },
        { nl: 'pt', 'pt-*': 'pt' },
    ],
    directory: path.join('./', 'locales'),
}
const i18n = new I18n(i18nConfig);  

module.exports = { i18nConfig, i18n };