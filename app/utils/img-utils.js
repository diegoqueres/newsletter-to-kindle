const axios = require('axios');

class ImgUtils {
    static async toBase64(url) {
        return axios.get(url, {responseType: 'arraybuffer'})
            .then((image) => {
                let raw = Buffer.from(image.data).toString('base64');
                return "data:" + image.headers["content-type"] + ";base64,"+raw;
            });
    }
}

module.exports = ImgUtils;