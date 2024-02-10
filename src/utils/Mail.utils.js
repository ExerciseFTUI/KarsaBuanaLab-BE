const nodemailer = require('nodemailer');
require('dotenv/config')

const createTransport = async () => {
    return nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.BREVO_EMAIL,
            pass: process.env.BREVO_PASSWORD
        }
    });
};

exports.notifyEmail = async (email, subject, message) => {
    (await createTransport()).sendMail({
        from: process.env.BREVO_EMAIL,
        to: email,
        subject: subject,
        text: message
    });
}