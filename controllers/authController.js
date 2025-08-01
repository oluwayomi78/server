const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

exports.signupPage = (req, res) => {
    res.send("user successfully signed up");
};

exports.signup = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new User({
            firstName,
            lastName,
            email,
            phoneNumber,
            password: hashedPassword
        });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
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
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });
        const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || "secretkey", 
        { expiresIn: "1h" }
    );
        // res.status(200).json({ message: "Login successful" });
            res.status(200).json({
            message: "Login successful",
            token,
            user: {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
        }
});
    } catch (err) {
        console.error("Login failed:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error("Error fetching current user:", err);
        res.status(401).json({ message: "Invalid token" });
    }
};
