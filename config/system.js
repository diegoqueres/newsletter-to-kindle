require('dotenv').config();
const appPort = process.env.APPLICATION_PORT || 8080;

exports.port = () => {
    return appPort;
}

exports.host = () => {
    return process.env.APPLICATION_HOST;
}

exports.baseUrl = () => {
    return process.env.APPLICATION_BASE_URL && process.env.APPLICATION_BASE_URL !== ''
            ? process.env.APPLICATION_BASE_URL
            : `${process.env.APPLICATION_PROTOCOL}://${process.env.APPLICATION_HOST}:${appPort}`;
}