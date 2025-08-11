// utils/email.js

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter using your email service provider details
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // or another service like SendGrid, Mailgun, etc.
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // 2. Define email options
    const mailOptions = {
        from: `Event Management App <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;