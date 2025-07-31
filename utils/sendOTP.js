const nodemailer = require("nodemailer")
require("dotenv").config()

const sendOTP = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Secure App" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
            html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error(" Failed to send OTP email:", error);
    }
};

module.exports = sendOTP;