require('dotenv').config();
const ArrayUtils = require('../utils/array-utils');
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

class EmailService {
  constructor(locale = process.env.APPLICATION_LOCALE, hasTemplate = true) {
    this.locale = locale;
    this.initTransporter();

    if (hasTemplate)
      this.initTemplateConfig();
  }

  // Configura os parâmetros de conexão com servidor.
  initTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_SERVER,
      port: Number(process.env.EMAIL_SMTP_PORT),
      secure: (Number(process.env.EMAIL_SMTP_PORT) === 465),
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASSWORD,
      }
    })
  }

  initTemplateConfig() {
    const templatesPath = `./templates/${this.locale}/`;
    const handlebarOptions = {
      viewEngine: {
        partialsDir: path.resolve(templatesPath),
        defaultLayout: false,
      },
      viewPath: path.resolve(templatesPath),
    };
    this.transporter.use('compile', hbs(handlebarOptions));
  }

  async sendMail(emailData) {
    const mailOptions = this.handleMailOptions(emailData);
    return this.transporter.sendMail(mailOptions);
  }

  handleMailOptions(emailData) {
    const { toEmail, htmlContent, content, subject, template, context, encoding, attachments } = emailData;
    const fromMail = this.getFromMail();

    let handledAttachments;
    if (ArrayUtils.isStringArr(attachments)) {
      handledAttachments = attachments.map((item) => { return { path: item } });
    } 

    const mailOptions = {
      encoding: encoding || 'utf8',
      from: fromMail,
      to: toEmail,
      subject: subject,
      text: content,
      html: htmlContent,
      attachments: handledAttachments || attachments
    };

    if (template) {
      mailOptions.template = template;
      mailOptions.context = {
        ...context,
        subject,
        "service-name": process.env.SERVICE_NAME
      }
    }

    return mailOptions;
  }

  getFromMail() {
    return '"' + process.env.SERVICE_NAME + '" <' + process.env.EMAIL_SMTP_EMAIL + '>';
  }

  close() {
    this.transporter.close();
  }
}
module.exports = EmailService;