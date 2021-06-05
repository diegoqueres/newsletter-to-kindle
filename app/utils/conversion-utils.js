const sanitizeHtml = require('sanitize-html');

class ConversionUtils {
    static stringToBoolean(str) {
        return (str.toLowerCase() == 'true');
    }
    static htmlToPlainText(html) {
        return sanitizeHtml(html, {
            allowedTags: [],
            allowedAttributes: {}
        }); 
    }
}
module.exports = ConversionUtils;