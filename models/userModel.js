const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: [true, "Email has been used before, try another email"]
    },
    phoneNumber: {
        type: String,
        required: true,
        minlength: [11, "Phone number must be 11 digits long"]
    },
    password: {
        type: String,
        required: true,
        minlength: [6, "Password must be at least 6 digits long"]
    },
    registrationDate: { type: String, default: Date.now() }
});

module.exports = mongoose.model("User", userSchema);