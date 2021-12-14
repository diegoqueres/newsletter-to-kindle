require('dotenv').config();
require('express-async-errors');
const express = require('express');
const helmet = require("helmet");
const cors = require('cors');
const {apiLogger, createMetadata} = require('./config/logger');
const APIError = require('./app/errors/api-error');
const HttpStatus = require('./app/errors/http-status');
const {i18n} = require('./config/i18n.config');
const {port, baseUrl} = require('./config/system');

(async () => {
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cors());
    app.use(helmet());
    app.use(i18n.init);

    app.use('/public', require("./routes/public"));
    app.use('/api', require("./routes/api"));
    app.get('/', (req, res) => {
        return res.send('<h3><i>newsletter-to-kindle</i> Rest API is running =)</h3>');
    });

    // middlewares
    app.use((error, req, res, next) => {
        if (error) {
            console.error(error);
            if (error instanceof APIError) {
                if (res.__(error.description))
                    error.description = res.__(error.description);

                if (res.html && res.html === true) {
                    const html = `<p><i><b>${res.__('error.error')} ${error.httpCode}</b>: ${error.description}</i></p>`;
                    res.status(error.httpCode).send(html);
                } else {
                    res.status(error.httpCode).json(error);
                }

                let meta = createMetadata(req, res, error, 'warn');
                apiLogger.warn(`${req.method}:${req.url} ${error.httpCode}`, meta);
                return next(res);
            } 

            const jsonResponse = {
                name: 'Internal server error',
                description: res.__('error.internal-error'),
                httpCode: HttpStatus.INTERNAL_SERVER
            }
            res.status(HttpStatus.INTERNAL_SERVER).json(jsonResponse);
            let meta = createMetadata(req, res, error, 'error');
            apiLogger.error(`${req.method}:${req.url} ${error.httpCode}`, meta);
        }
    });
    app.use((req, res, next) => {
        const meta = createMetadata(req, res);
        apiLogger.info(`${req.method}:${req.url} ${res.statusCode}`, meta);
    });

    app.listen(port());
    apiLogger.info(`Server started and running on ${baseUrl()}`);
})();