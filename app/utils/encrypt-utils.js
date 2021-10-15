const crypto = require('crypto');

class Encrypter {
    static encrypt(data, salt) {
        return crypto
            .pbkdf2Sync(data, salt, 1000, 64, 'sha512')
            .toString('hex');
    }
}
module.exports = Encrypter;