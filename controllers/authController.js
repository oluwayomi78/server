const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const Notification = require("../models/Notification");
const nodemailer = require('nodemailer');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const cron = require("node-cron");

function calculateAge(dateString) {
    const dob = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

exports.signupPage = (req, res) => {
    res.send("user successfully signed up");
};


exports.signup = async (req, res) => {
    // Accept both 'gender' and 'Gender' from frontend
    let { firstName, lastName, email, phoneNumber, password, dateOfBirth, Gender, gender, accountType } = req.body;
    // Prefer 'Gender' if present, else use 'gender'
    if (!Gender && gender) Gender = gender;

    try {
        // 🔹 Validate required fields
        if (!firstName || !lastName || !email || !phoneNumber || !password || !dateOfBirth || !Gender || !accountType) {
            return res.status(400).json({ message: "All fields are required (firstName, lastName, email, phoneNumber, password, dateOfBirth, gender, accountType)" });
        }

        // 🔹 Check DOB format
        const dobDate = new Date(dateOfBirth);
        if (isNaN(dobDate)) {
            return res.status(400).json({ message: "Invalid date of birth format" });
        }

        // 🔹 Age restriction
        if (calculateAge(dateOfBirth) < 16) {
            return res.status(400).json({ message: "User must be at least 16 years old" });
        }

        // 🔹 Check email uniqueness
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        // 🔹 Check phone uniqueness
        const existingPhone = await User.findOne({ phoneNumber });
        if (existingPhone) {
            return res.status(409).json({ message: 'Phone number already exists' });
        }

        // 🔹 Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 🔹 Generate unique 10-digit account number
        let accountNumber;
        let isUnique = false;
        while (!isUnique) {
            accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
            const existingUser = await User.findOne({ accountNumber });
            if (!existingUser) isUnique = true;
        }
        const defaultBalance = 100000;
        // 🔹 Create new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            phoneNumber,
            password: hashedPassword,
            accountNumber,
            transferPin: null,
            balance: defaultBalance,
            dateOfBirth,
            Gender,
            accountType,
            bankDetails: {
                bankName: "Precious Bank",
                bankCode: "2580",
                accountNumber,   // generated accountNumber
                accountName: `${firstName} ${lastName}`  // or however you want to set it
            },
            address: {
                street: "N/A",
                city: "N/A",
                state: "N/A",
                country: "N/A",
                zip: "00000"
            },
            accountTier: "Tier 1", // Default tier
            currency: "NGN", // Default currency
            accountStatus: "ACTIVE", // Must match enum in schema
            statusReason: "No reason provided", // Default status reason
            isActive: true, // Default active status
            registrationDate: new Date(),
        });

        await newUser.save();

        // Send welcome email using nodemailer
        try {
            let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: `"Precious Bank" <${process.env.EMAIL_USER}>`,
                to: newUser.email,
                subject: "Welcome to Precious Bank!",
                text: `Hello ${newUser.firstName},\n\nWelcome to Precious Bank! Your account has been created successfully.\n\nAccount Number: ${newUser.accountNumber}\n\nThank you for joining us!`,
                html: `<h2>Hello ${newUser.firstName},</h2><p>Welcome to <b>Precious Bank</b>! Your account has been created successfully.</p><p><b>Account Number:</b> ${newUser.accountNumber}</p><p>Thank you for joining us!</p>`,
            };

            await transporter.sendMail(mailOptions);
        } catch (emailErr) {
            console.error("Signup: Failed to send welcome email", emailErr);
            // Do not block signup if email fails
        }

        res.status(201).json({
            message: "User registered successfully",
            id: newUser._id, // <-- Add this line for frontend PIN setup
            accountNumber: newUser.accountNumber,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            phoneNumber: newUser.phoneNumber,
            balance: newUser.balance,
            isActive: newUser.isActive,
            accountType: newUser.accountType,
            currency: newUser.currency,
            accountStatus: newUser.accountStatus,
            statusReason: newUser.statusReason,
            registrationDate: newUser.registrationDate,
            hasPin: false,
            token: jwt.sign(
                { id: newUser._id, email: newUser.email },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            ),
        });
    } catch (err) {
        console.error("Could not save information", err);
        res.status(500).json({ message: "Error registering user" });
    }
};

exports.loginPage = (req, res) => {
    res.send("user successfully logged in");
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select("+password");
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Send login notification email using nodemailer
        try {
            let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: `"Precious Bank" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Login Notification - Precious Bank",
                text: `Hello ${user.firstName},\n\nYour account was just logged in. If this was not you, please contact support immediately.\n\nTime: ${new Date().toLocaleString()}`,
                html: `<h2>Hello ${user.firstName},</h2><p>Your account was just <b>logged in</b>.</p><p>If this was not you, please contact support immediately.</p><p><b>Time:</b> ${new Date().toLocaleString()}</p>`
            };

            await transporter.sendMail(mailOptions);
        } catch (emailErr) {
            console.error("Login: Failed to send login notification email", emailErr);
            // Do not block login if email fails
        }

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                accountNumber: user.accountNumber,
                isAdmin: user.isAdmin || false
            }
        });
    } catch (err) {
        console.error("Login failed:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
};

exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error("Error fetching current user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateUser = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, dateOfBirth, gender, accountTier, accountStatus, profilePhoto, address, accountType } = req.body;

    try {
        // If profilePhoto is not provided or is empty, use initials avatar
        let finalProfilePhoto = profilePhoto;
        if (!finalProfilePhoto || finalProfilePhoto.trim() === "") {
            let first = firstName ? firstName[0].toUpperCase() : '';
            let last = lastName ? lastName[0].toUpperCase() : '';
            let initials = (first + last) || 'U';
            finalProfilePhoto = `https://ui-avatars.com/api/?name=${initials}&background=4f46e5&color=fff&size=128&rounded=true`;
        }

        const userId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findByIdAndUpdate(userId, {
            firstName,
            lastName,
            email,
            phoneNumber,
            dateOfBirth,
            gender,
            accountTier,
            accountType,
            accountStatus,
            profilePhoto: finalProfilePhoto,
            address
        }, { new: true });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User updated successfully",
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phoneNumber: user.phoneNumber,
                accountTier: user.accountTier,
                accountStatus: user.accountStatus,
                address: user.address,
                profilePhoto: user.profilePhoto,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender
            }
        });
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}


exports.fetchUserAccountName = async (req, res) => {
    const { accountNumber, bankName } = req.body;
    try {
        if (!accountNumber || !bankName) {
            return res.status(400).json({ success: false, message: "accountNumber and bankName are required" });
        }
        // Use $and to combine $or conditions for accountNumber and bankName
        const user = await User.findOne({
            $and: [
                { $or: [{ accountNumber: accountNumber }, { 'bankDetails.accountNumber': accountNumber }] },
                { $or: [{ 'bankDetails.bankName': { $regex: `^${bankName}$`, $options: 'i' } }, { bankName: { $regex: `^${bankName}$`, $options: 'i' } }] }
            ]
        }).select('firstName lastName');
        if (!user) {
            return res.status(404).json({ success: false, message: "User with this account not found" });
        }
        const accountName = `${user.firstName} ${user.lastName}`;
        // const accountName = ${user.bankDetails.accountName};
        console.log("Account Name:", accountName);
        return res.json({ success: true, accountName });
    } catch (error) {
        console.error("Error fetching user account name:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.transferFunds = async (req, res) => {
    const { accountNumber, bankName, amount, note } = req.body;

    try {
        if (!accountNumber || !bankName || !amount) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }



        const senderId = req.user && (req.user._id || req.user.id || req.user);
        const sender = await User.findById(senderId);
        if (!sender) return res.status(404).json({ success: false, message: "Sender not found" });

        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid transfer amount" });
        }

        if (sender.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient funds" });
        }

        const recipient = await User.findOne({
            $and: [
                { accountNumber: accountNumber },
                { 'bankDetails.bankName': { $regex: `^${bankName}$`, $options: 'i' } }
            ]
        });

        if (!recipient) {
            return res.status(404).json({ success: false, message: "Recipient not found" });
        }

        sender.balance = Number(sender.balance) - amount;
        recipient.balance = Number(recipient.balance) + amount;

        await sender.save();
        await recipient.save();

        // 🔹 Save transaction record
        const transaction = new Transaction({
            sender: sender._id,
            recipient: recipient._id,
            amount,
            note: `Transfer to ${recipient.accountNumber}`,
            type: "TRANSFER",
            status: "SUCCESS"
        });
        await transaction.save();

        res.json({
            success: true,
            message: "Transfer successful",
            senderBalance: sender.balance,
            transactionId: transaction._id
        });

    } catch (error) {
        console.error("Error in transferFunds:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.getTransactionHistory = async (req, res) => {
    try {
        let userId = req.user && (req.user._id || req.user.id || req.user);
        if (userId && userId._id) userId = userId._id;
        userId = userId ? userId.toString() : '';

        const transactions = await Transaction.find({
            $or: [
                { sender: userId },
                { recipient: userId }
            ]
        })
            .populate('sender recipient', 'firstName lastName accountNumber')
            .sort({ createdAt: -1 });

        const mapped = transactions.map((t) => {
            let type = 'debit';
            const purchaseTypes = ['AIRTIME', 'DATA', 'SAFEBOX', 'BETTING', 'TV'];
            // If transaction type is a purchase, always mark as debit
            if (purchaseTypes.includes((t.type || '').toUpperCase())) {
                type = 'debit';
            } else {
                // Otherwise, infer from sender/recipient
                const recipientId = t.recipient && t.recipient._id ? t.recipient._id.toString() : '';
                if (recipientId === userId) {
                    type = 'credit';
                }
            }
            let description = t.note || (t.type === 'TRANSFER' ? 'Transfer' : t.type);
            return {
                id: t._id ? t._id.toString() : (t.id ? t.id.toString() : undefined),
                description,
                date: t.createdAt ? t.createdAt.toISOString() : '',
                type,
                amount: t.amount,
                sender: t.sender,
                recipient: t.recipient
            };
        });

        res.json(mapped);
    } catch (error) {
        console.error("Error fetching transaction history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// exports.transferPin = async (req, res) => {
//     try {
//         const { email, pin } = req.body;
//         if (!email || !pin) {
//             return res.status(400).json({ success: false, message: "email and pin are required" });
//         }
//         // Use Pin model to find user's PIN
//         const pinDoc = await Pin.findOne({ user: email }).select('+pin');
//         if (!pinDoc) {
//             return res.status(404).json({ success: false, message: "No PIN set for this user" });
//         }
//         const isMatch = await bcrypt.compare(pin, pinDoc.pin);
//         if (!isMatch) {
//             return res.status(401).json({ success: false, message: "Incorrect PIN" });
//         }
//         return res.json({ success: true, message: "PIN verified" });
//     } catch (error) {
//         console.error("Error verifying transfer PIN:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// }


exports.setPin = async (req, res) => {
    const { userId, pin } = req.body;

    if (!pin) {
        return res.status(400).json({ success: false, message: "PIN is required" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Hash and set the transferPin
        const hashedPin = await bcrypt.hash(pin, saltRounds);
        user.transferPin = hashedPin;
        await user.save();
        return res.json({ success: true, message: "PIN set successfully" });
    } catch (error) {
        console.error("Error setting transfer PIN:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.verifyPin = async (req, res) => {
    const { userId, pin } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // Initialize pinAttempts if not present
    if (typeof user.pinAttempts !== 'number') user.pinAttempts = 0;

    //Check if locked
    if (user.isLocked) {
        return res.status(401).json({ success: false, message: "User is locked" });
    }
    if (!user.transferPin) {
        return res.status(400).json({ success: false, message: "No PIN set for this user" });
    }
    const isMatch = await bcrypt.compare(pin, user.transferPin);
    if (!isMatch) {
        user.pinAttempts += 1;
        // Lock after 5 failed attempts
        if (user.pinAttempts >= 5) {
            user.isLocked = true;
        }
        await user.save();
        if (user.isLocked) {
            return res.status(401).json({ success: false, message: "User is locked due to too many failed attempts" });
        }
        return res.status(401).json({ success: false, message: `Incorrect PIN. Attempts left: ${5 - user.pinAttempts}` });
    }

    // Reset attempts on success
    user.pinAttempts = 0;
    await user.save();
    return res.json({ success: true, message: "PIN verified" });
}


exports.airtime = async (req, res) => {
    const { network, phone, amount } = req.body;
    if (!network || !phone || !amount) {
        return res.status(400).json({ success: false, message: "Network, phone number, and amount are required" });
    }
    try {
        const senderId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        user.balance = Number(user.balance) - amount;
        await user.save();
        const transaction = new Transaction({
            sender: senderId,
            recipient: senderId,
            amount,
            type: 'AIRTIME',
            note: `Airtime purchase from ${network} to ${phone}`,
            // status: 'debit'
        });
        await transaction.save();
        return res.json({ success: true, message: "Airtime purchase successful", balance: user.balance });
        // console.log("Airtime transaction:", transaction);
    } catch (err) {
        console.error("Airtime error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


exports.data = async (req, res) => {
    const { network, phone, amount } = req.body;
    if (!network || !phone || !amount) {
        return res.status(400).json({ success: false, message: "Network, phone number, and amount are required" });
    }
    try {
        const senderId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        user.balance = Number(user.balance) - amount;
        await user.save();
        const transaction = new Transaction({
            sender: senderId,
            recipient: senderId,
            amount,
            type: 'DATA',
            note: `Data purchase from ${network} to ${phone}`,
            status: 'debit'
        });
        await transaction.save();
        return res.json({ success: true, message: "Data purchase successful", balance: user.balance });
        // console.log("Data transaction:", transaction);
    } catch (err) {
        console.error("Data error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.betting = async (req, res) => {
    const { betting, userId, amount } = req.body;
    if (!betting || !userId || !amount) {
        return res.status(400).json({ success: false, message: "Betting site, user ID, and amount are required" });
    }
    try {
        const senderId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        user.balance = Number(user.balance) - amount;
        await user.save();
        const transaction = new Transaction({
            sender: senderId,
            recipient: senderId,
            amount,
            type: 'BETTING',
            note: `Successfully placed a bet of #${amount} on ${betting} for ${userId}`,
            status: 'debit'
        });
        await transaction.save();
        return res.json({ success: true, message: "Betting successful", balance: user.balance });
        // console.log("Betting transaction:", transaction);
    } catch (err) {
        console.error("Betting error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.tv = async (req, res) => {
    let { channel, package: tvPackage, amount } = req.body;
    if (!channel || !tvPackage || !amount) {
        return res.status(400).json({ success: false, message: "Channel, package, and amount are required" });
    }
    let packageName = typeof tvPackage === 'object' && tvPackage !== null ? tvPackage.name : tvPackage;
    if (!packageName) {
        return res.status(400).json({ success: false, message: "Package name is required" });
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    try {
        const senderId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        user.balance = Number(user.balance) - amount;
        await user.save();
        const transaction = new Transaction({
            sender: senderId,
            recipient: senderId,
            amount,
            type: 'TV',
            note: `TV subscription for ${channel} (${packageName})`,
            status: 'debit'
        });
        await transaction.save();
        return res.json({ success: true, message: "TV subscription successful", balance: user.balance });
    } catch (err) {
        console.error("TV error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.safebox = async (req, res) => {
    const { amount, duration } = req.body;
    if (!amount || !duration) {
        return res.status(400).json({ success: false, message: "Amount and duration are required" });
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) {
        return res.status(400).json({ success: false, message: "Invalid duration" });
    }
    try {
        const senderId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }
        user.balance = Number(user.balance) - amount;
        await user.save();
        const transaction = new Transaction({
            sender: senderId,
            recipient: senderId,
            amount,
            type: 'SAFEBOX',
            note: `Safebox deposit of ₦${amount} for ${duration} days`,
            status: 'debit'
        });
        await transaction.save();
        return res.json({ success: true, message: "Funds locked in safebox", balance: user.balance });
    } catch (err) {
        console.error("Safebox error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

exports.loan = async (req, res) => {
    const { amount, duration } = req.body;
    if (!amount || !duration) {
        return res.status(400).json({ success: false, message: "Amount and duration are required" });
    }
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) {
        return res.status(400).json({ success: false, message: "Invalid duration" });
    }

    try {
        const senderId = req.user && (req.user._id || req.user.id || req.user);
        const user = await User.findById(senderId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Loan logic: add the loan amount to user's balance
        user.balance = Number(user.balance) + amount;
        await user.save();
        // Calculate due date (duration in months)
        const now = new Date();
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + Number(duration));
        const transaction = new Transaction({
            sender: senderId,
            recipient: senderId,
            amount,
            type: 'LOAN',
            note: `Loan of ₦${amount} for ${duration} months`,
            status: 'credit',
            dueDate,
            loanStatus: 'unpaid'
        });
        await transaction.save();
        return res.json({ success: true, message: "Loan processed successfully", balance: user.balance });
    } catch (err) {
        console.error("Loan error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}


cron.schedule("0 0 * * *", async () => {
    console.log("🔍 Checking for due loans...");

    try {
        const dueLoans = await Transaction.find({
            type: "LOAN",
            loanStatus: "unpaid",
            dueDate: { $lte: new Date() }
        });

        for (const loan of dueLoans) {
            const user = await User.findById(loan.sender);
            if (!user) continue;

            if (user.balance >= loan.amount) {
                // User has enough balance to repay the loan
                user.balance -= loan.amount;
                loan.loanStatus = "paid";
                loan.status = "debit";

                await user.save();
                await loan.save();

                console.log(`✅ Loan repaid for user ${user._id}`);
            } else {
                // Not enough balance → mark as overdue
                loan.loanStatus = "overdue";
                await loan.save();

                console.log(`⚠️ Loan overdue for user ${user._id}`);
            }
        }
    } catch (err) {
        console.error("❌ Loan cron error:", err);
    }
});


exports.getLoans = async (req, res) => {
    try {
        const userId = req.user && (req.user._id || req.user.id || req.user);

        const loans = await Transaction.find({
            $or: [
                { sender: userId, type: "LOAN" },
                { recipient: userId, type: "LOAN" }
            ]
        })
            .populate('sender recipient', 'firstName lastName accountNumber')
            .sort({ createdAt: -1 });

        const loansWithDuration = loans.map(loan => {
            let durationMonths = null;
            if (loan.dueDate && loan.createdAt) {
                const created = new Date(loan.createdAt);
                const due = new Date(loan.dueDate);
                durationMonths = (due.getFullYear() - created.getFullYear()) * 12 + (due.getMonth() - created.getMonth());
                if (due.getDate() < created.getDate()) durationMonths--;
                if (durationMonths < 1) durationMonths = 1;
            }
            const obj = loan.toObject();
            // Always provide loanStatus for frontend
            if (!obj.loanStatus) obj.loanStatus = 'unpaid';
            return {
                ...obj,
                durationMonths
            };
        });
        return res.json({ success: true, transactions: loansWithDuration });
    } catch (err) {
        console.error("Fetch loans error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.Invitation = async (req, res) => {
    const { email, message } = req.body;

    try {
        if (!email || !message) {
            return res.status(400).json({
                success: false,
                message: "Recipient email and message are required",
            });
        }

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 🔹 Compose email
        const mailOptions = {
            from: `"Precious Bank" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "You're Invited!",
            text: message,
            html: `<p>${message}</p>`,
        };

        // 🔹 Send email
        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: `Invitation sent successfully to ${email}`,
        });
    } catch (error) {
        console.error("Invitation error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send invitation",
        });
    }
};

// Create a new notification
exports.notification = async (req, res) => {
    try {
        const { title, message, type } = req.body;
        const userId = req.user && (req.user._id || req.user.id || req.user);

        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Title and message are required" });
        }

        const notif = new Notification({
            user: userId,
            title,
            message,
            type: type || "info",
        });

        await notif.save();

        return res.json({
            success: true,
            message: "Notification created successfully",
            data: notif,
        });
    } catch (error) {
        console.error("Notification error:", error);
        return res.status(500).json({ success: false, message: "Failed to create notification" });
    }
};


exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user && (req.user._id || req.user.id || req.user);

        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });

        return res.json({ success: true, data: notifications });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

// Mark as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        return res.json({ success: true, message: "Notification marked as read", data: notification });
    } catch (error) {
        console.error("Mark as read error:", error);
        return res.status(500).json({ success: false, message: "Failed to update notification" });
    }
};

