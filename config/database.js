require('dotenv').config();

const databaseData =  {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: (process.env.DB_LOGGING === 'true')
}

module.exports = databaseData;