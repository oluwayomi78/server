const mongoose = require("mongoose");

const MINIMUM_AGE = 16;

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
        match: /^[A-Za-z .'-]+$/,
        set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
    },

    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 60,
        match: /^[A-Za-z .'-]+$/,
        set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
    },

    email: {
        type: String,
        required: true,
        unique: [true, "Email has been used before, try another email"],
        lowercase: true,
        match: /^\S+@\S+\.\S+$/
    },

    phoneNumber: {
        type: String,
        required: true,
        minlength: [11, "Phone number must be 11 digits long"],
        match: /^[0-9]{11}$/
    },

    password: {
        type: String,
        required: true,
        minlength: [6, "Password must be at least 6 characters long"],
        select: false
    },

    Gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },

    dateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                const today = new Date();
                const minDate = new Date(today.setFullYear(today.getFullYear() - MINIMUM_AGE));
                return value <= minDate;
            },
            message: `User must be at least ${MINIMUM_AGE} years old`
        }
    },

    address: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
    },

    accountNumber: {
        type: String,
        unique: true,
        required: true
    },

    balance: {
        type: Number,
        default: 100000
    },

    bankDetails: {
    bankName: { 
        type: String, 
        required: true, 
        default: "Precious Bank" 
    },
    bankCode: { 
        type: String, 
        required: true, 
        default: "2580" 
    },
    accountNumber: { 
        type: String,  
        required: true,
        unique: true
    },
    accountName: { 
        type: String,  
        required: true 
    },
},
    transferPin: {
        type: String, 
        default: null 
    }, 
    pinAttempts: { 
        type: Number, 
        default: 0 
    }, 
    pinLockedUntil: { 
        type: Date,
        default: null 
    }, 
    hasPin: { 
        type: Boolean, 
        default: false 
    },   

    currency: {
        type: String,
        default: 'NGN',
        match: /^[A-Z]{3}$/
    },

    accountType: {
        type: String,
        enum: ["Savings", "Current", "Business"],
        default: "Savings"
    },

    accountTier: {
        type: String,
        enum: ["Tier 1", "Tier 2", "Tier 3"],
        default: "Tier 1",
        required: true
    },

    accountStatus: {
        type: String,
        enum: ['ACTIVE', 'FROZEN', 'CLOSED'],
        default: 'ACTIVE'
    },

    statusReason: {
        type: String,
        maxlength: 255,
        default: 'No reason provided'
    },

    isActive: {
        type: Boolean,
        default: true
    },

    registrationDate: {
        type: Date,
        default: Date.now
    },
    profilePhoto: {
        type: String,
        default: function() {
            let first = this.firstName ? this.firstName[0].toUpperCase() : '';
            let last = this.lastName ? this.lastName[0].toUpperCase() : '';
            let initials = (first + last) || 'U';
            return `https://ui-avatars.com/api/?name=${initials}&background=4f46e5&color=fff&size=128&rounded=true`;
        }
    },
    biometric: {
        credentialID: { type: String, default: null },     
        publicKey: { type: String, default: null },        
        counter: { type: Number, default: 0 }              
    }

}, {
    timestamps: true
});


module.exports = mongoose.model("User", userSchema);
