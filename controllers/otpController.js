const OTP = require("../models/otpModel");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const sendOTP = require("../utils/sendOTP");


exports.requestOTP = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    console.log(user)
    if (!user) return res.status(404).json({ message: "Email not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();  // 6-digit

    const newOtp = new OTP({ email, otp: otpCode });
    await newOtp.save();

    await sendOTP(email, otpCode);

    res.status(200).json({ message: "OTP sent to your email" });
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) return res.status(400).json({ message: "Invalid or expired OTP" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    await OTP.deleteMany({ email }); // cleanup

    res.status(200).json({ message: "Password reset successful" });
};