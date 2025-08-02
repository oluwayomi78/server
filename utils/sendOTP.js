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
    from: `"PreciousBank" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Your PreciousBank OTP Code",
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    html: `
    <div style="max-width: 600px; margin: auto; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fdfdfd;">
        
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="../images/image-removebg-preview (28).png" alt="PreciousBank Logo" style="height: 60px;" />
        </div>

        <h2 style="text-align: center; color: #1a1a16;">🔐 One-Time Password (OTP)</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">
            Your OTP code for PreciousBank is:
        </p>
        <div style="font-size: 24px; font-weight: bold; color: #1a1a16; text-align: center; margin: 20px 0;">
            ${otp}
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">
            This code will expire in 5 minutes. Do not share this code with anyone.
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000/reset" style="background-color: #1a1a16; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Page
            </a>
        </div>
        <p style="font-size: 12px; color: #aaa; margin-top: 30px; text-align: center;">
            If you didn't request this, please ignore this email.
        </p>
    </div>
    `
};



        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error(" Failed to send OTP email:", error);
    }
};

module.exports = sendOTP;