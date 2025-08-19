const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // If password is select: false in schema, use .select('+password')
        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.isAdmin) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                isAdmin: true
            },
            process.env.JWT_SECRET || "secretkey",
            { expiresIn: "2h" }
        );

        res.status(200).json({
            message: "Admin login successful",
            token,
            user: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                isAdmin: true
            }
        });
    } catch (err) {
        console.error("Admin login failed:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

