const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Not required for airtime/external
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    note: {
        type: String,
        default: ""
    },
    type: {
        type: String,
        enum: ["TRANSFER", "DEPOSIT", "WITHDRAWAL", "AIRTIME", "DATA", "BETTING", "TV", "SAFEBOX", "LOAN"],
        default: "TRANSFER"
    },
    status: {
        type: String,
        enum: ["SUCCESS", "FAILED", "PENDING", "debit", "credit"], // Allow debit/credit for frontend transaction type
        default: "SUCCESS"
    },
    dueDate: {
        type: Date
    },
    loanStatus: {
        type: String,
        enum: ["unpaid", "paid", "overdue"],
        default: undefined
    },
    // card field removed as it's not used for transaction type
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Transaction", transactionSchema);
