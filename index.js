require('dotenv').config();
require('express-async-errors');
const cors = require('cors');
const express = require('express');
const {apiLogger, createMetadata} = require('./config/logger');
const APIError = require('./app/errors/api-error');
const HttpStatus = require('./app/errors/http-status');
const {i18n} = require('./config/i18n.config');
const port = process.env.PORT || 8080;

(async () => {
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cors());
    app.use(i18n.init);

    app.use('/public', require("./routes/public"));
    app.use('/api', require("./routes/api"));

    // middlewares
    app.use((error, req, res, next) => {
        if (error) {
            if (error instanceof APIError) {
                if (res.__(error.description))
                    error.description = res.__(error.description);
                res.status(error.httpCode).json(error);
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

    app.listen(port);
    apiLogger.info(`Server started and running on http://${process.env.APPLICATION_HOST}:${port}`);
})();