const nodemailer = require('nodemailer');

const { config } = require('./config');
const {log} = require('./log.js')

defaultMailConfig = {
    host: 'localhost',
    port: 25,
    security: false,
    username: '',
    password: ''
};
mailConfig = { ...defaultMailConfig, ...config.mail };

// Mail transporter setup
const transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.security || false,
    auth: mailConfig.username && mailConfig.password ? {
        user: mailConfig.username,
        pass: mailConfig.password,
    } : undefined,
});

// Function to send an email
module.exports.sendEmail = sendEmail;

async function sendEmail(subject, message) {
    const mailOptions = {
        from: mailConfig.from,
        to: mailConfig.to,
        subject,
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        log(`Alert sent: ${subject}`, 'INFO');
    } catch (error) {
        log(`Failed to send email: ${error.message}`, 'ERROR');
    }
}

