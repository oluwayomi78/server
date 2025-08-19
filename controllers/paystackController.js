const axios = require("axios");
const User = require("../models/userModel");

exports.createRecipient = async (req, res) => {
    try {
        const { name, account_number, bank_code, currency } = req.body;

        if (!name || !account_number || !bank_code || !currency) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (!process.env.PAYSTACK_SECRET_KEY) {
            return res.status(500).json({ message: "Paystack secret key not set in environment." });
        }

        const response = await axios.post(
            "https://api.paystack.co/transferrecipient",
            {
                type: "nuban",
                name,
                account_number,
                bank_code,
                currency,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data && response.data.status) {
            res.status(200).json({
                message: "Recipient created successfully",
                recipient: response.data.data,
            });
        } else {
            res.status(500).json({ message: "Failed to create recipient", details: response.data });
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || error.response?.data || error.message;
        console.error("Paystack createRecipient error:", errMsg);
        res.status(500).json({ message: "Paystack error", error: errMsg });
    }
};

exports.makeTransfer = async (req, res) => {
    try {
        const { recipient_code, amount, reason } = req.body;

        if (!recipient_code || !amount) {
            return res.status(400).json({ message: "recipient_code and amount are required" });
        }
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number" });
        }
        if (!process.env.PAYSTACK_SECRET_KEY) {
            return res.status(500).json({ message: "Paystack secret key not set in environment." });
        }

        const response = await axios.post(
            "https://api.paystack.co/transfer",
            {
                source: "balance",
                reason: reason || "Test Transfer",
                amount: Math.round(amount * 100), // Paystack expects amount in kobo
                recipient: recipient_code,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data && response.data.status) {
            res.status(200).json({
                message: "Transfer initiated successfully",
                transfer: response.data.data,
            });
        } else {
            res.status(500).json({ message: "Failed to initiate transfer", details: response.data });
        }
    } catch (error) {
        const errMsg = error.response?.data?.message || error.response?.data || error.message;
        console.error("Paystack makeTransfer error:", errMsg);
        res.status(500).json({ message: "Paystack error", error: errMsg });
    }
};
