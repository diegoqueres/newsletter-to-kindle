const nodemailer = require("nodemailer");

class EmailSender {
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
    }

    async sendMail(emailData, closeComm = true) {
     const {toEmail, subject, htmlContent, content, encoding, attachments} = emailData;

     // send mail with defined transport object
     let attachmentsFiles = [];
      if (attachments)
        attachmentsFiles = attachments.map((item) => { return { path: item } });

      let mail = {
          encoding: encoding,
          from: `"${process.env.SERVICE_NAME} Service" <${process.env.EMAIL_SMTP_EMAIL}>`, // sender address
          to: toEmail, // list of receivers
          subject: subject, // Subject line
          text: content, // plain text body
          html: htmlContent, // html body
          attachments: attachmentsFiles
      };

      this.transporter.sendMail(mail, (error, response) => {
          if(error) throw error;
          else console.log("Message has been sent.");
          if (closeComm) this.close();
      });

    }

    close() {
        this.transporter.close();
    }

}
module.exports = EmailSender;