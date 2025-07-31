const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;

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

        // res.status(200).json({ message: "Login successful" });
            res.status(200).json({
            message: "Login successful",
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

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.log("Error fetching users:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
