require('dotenv').config();
const { createLogger, transports , format } = require('winston');
const databaseData = require('./database');
const {i18n} = require('./i18n.config');
var {Loggly} = require('winston-loggly-bulk');
const { SqlTransport } = require('winston-sql-transport');

exports.apiLogger = createLogger({
    level: 'info',
    exitOnError: false,
    format: format.combine(
        format.json(),
        format.timestamp()
    ),
    transports: [
        new transports.Console({
            format:format.combine(
                format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                format.align(),
                format.printf(info => `${[info.timestamp]}\t${info.level}: ${info.message}`),
        )}),
        new transports.Loggly({
            subdomain: process.env.LOGGING_LOGGLY_USER,
            inputToken: process.env.LOGGING_LOGGLY_TOKEN,
            tags: [process.env.LOGGING_LOGGLY_ENV_TAG, "api"],
            json: true
        })
    ]
});

exports.jobLogger = createLogger({
    level: 'info',
    exitOnError: false,
    format: format.combine(
        format.json(),
        format.timestamp()
    ),
    transports: [
        new transports.Console({
            format:format.combine(
                format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                format.align(),
                format.printf(info => `${[info.timestamp]}\t${info.level}: ${info.message}`),
        )}),
        new transports.Loggly({
            subdomain: process.env.LOGGING_LOGGLY_USER,
            inputToken: process.env.LOGGING_LOGGLY_TOKEN,
            tags: [process.env.LOGGING_LOGGLY_ENV_TAG, "jobs"],
            json: true
        })
    ]
});

exports.subscriptionLogger = createLogger({
    format: format.json(),
    transports: [new SqlTransport({
        name: 'SqlTransport',
        tableName: 'Logs',
        client: 'mysql2',
        connection: {
          user: databaseData.username,
          password: databaseData.password,
          host: databaseData.host,
          database: databaseData.database,
          port: databaseData.port,
        }
    })],
});

exports.createMetadata = (req, res, err, level = 'info') => {
    const meta = { 
        user: {}, 
        statusCode: res.statusCode
    };

    if (err) {
        meta.statusCode = err.httpCode;

        if (level && level !== 'warn')
            meta.errorStack = err.stack;

        meta.errorMessage = i18n.__(err.message)
            ? i18n.__(err.message)
            : err.message;
    }

    if (req.userId)
        meta.user.id = req.userId;
    else if (req.body.email)
        meta.user.email = req.body.email;
    else
        meta.user = null;

    return meta;
}