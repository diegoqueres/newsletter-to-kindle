require('dotenv').config();
require('express-async-errors');

const port = process.env.PORT || 8080;
const cors = require('cors');
const express = require('express');
const APIError = require('./app/errors/api-error');
const HttpStatus = require('./app/errors/http-status');

(async () => {
    const app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cors());

    app.use('/public', require("./routes/public"));
    app.use('/api', require("./routes/api"));
    app.use((error, req, res, next) => {
        if (error) {
            if (error instanceof APIError) {
                res.status(error.httpCode).json(error);
                return;
            } 
            console.log(error);
            res.status(HttpStatus.INTERNAL_SERVER).json('Internal server error');
        }
    });

    app.listen(port);
    console.log(`Listening on port ${port}`);
})();