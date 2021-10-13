require('dotenv').config();
require('express-async-errors');
const cors = require('cors');
const express = require('express');
const {apiLogger} = require('./config/logger');
const APIError = require('./app/errors/api-error');
const HttpStatus = require('./app/errors/http-status');
const port = process.env.PORT || 8080;

(async () => {
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cors());

    app.use('/public', require("./routes/public"));
    app.use('/api', require("./routes/api"));

    // Middlewares
    app.use((error, req, res, next) => {
        if (error) {
            if (error instanceof APIError) {
                res.status(error.httpCode).json(error);
                apiLogger.warn(`Api error ocurred: status code ${error.httpCode}: ${error.message}`);
                next(res);
            } 
            apiLogger.error(`Internal server error ocurred: ${error.message}`);
            res.status(HttpStatus.INTERNAL_SERVER).json('Internal server error');
        }
    });

    app.listen(port);
    apiLogger.info(`Server started and running on http://${process.env.APPLICATION_HOST}:${port}`);
})();