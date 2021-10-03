require('dotenv').config();
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SMTP_SERVER,
          port: Number(process.env.EMAIL_SMTP_PORT),
          secure: (Number(process.env.EMAIL_SMTP_PORT) === 465), // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_SMTP_USER, 
            pass: process.env.EMAIL_SMTP_PASSWORD, 
          },
        });

        const templatesPath = `./templates/${process.env.APPLICATION_LOCALE}/`;
        const handlebarOptions = {
          viewEngine: {
              partialsDir: path.resolve(templatesPath),
              defaultLayout: false,
          },
          viewPath: path.resolve(templatesPath),
        };
        this.transporter.use('compile', hbs(handlebarOptions));
    }

    async sendMail(emailData, closeComm = true) {
     const mailOptions = this.buildMailOptions(emailData);

      this.transporter.sendMail(mailOptions, (error, response) => {
          if(error) throw error;
          else console.log("Message has been sent.");
          if (closeComm) this.close();
      });
    }

    buildMailOptions(emailData) {
      const {toEmail, htmlContent, content, subject, template, context, encoding, attachments} = emailData;
 
      let attachmentsFiles = [];
       if (attachments)
         attachmentsFiles = attachments.map((item) => { return { path: item } });

      const fromMail = `"${process.env.SERVICE_NAME} Service" <${process.env.EMAIL_SMTP_EMAIL}>`;

      const mailOptions = {
        encoding: encoding,
        from: fromMail,
        to: toEmail, 
        subject: subject, 
        text: content,
        html: htmlContent, 
        attachments: attachmentsFiles
      };

      if (template) {
        mailOptions.template = template;
        mailOptions.context = {
          ... context,
          subject,
          "service-name": process.env.SERVICE_NAME
        }
      }

      return mailOptions;
    }

    close() {
        this.transporter.close();
    }
}
module.exports = EmailService;