require('dotenv').config();

const emailData = {
    toEmail: process.env.KINDLE_EMAIL, 
    subject: process.env.SERVICE_EMAIL_SUBJECT,
    content: null,
    htmlContent: null,
    encoding: 'utf8', 
    attachments: []
};

module.exports = emailData;