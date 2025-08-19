const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModels");

// LOGIN to admin account
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find admin and explicitly include password
        const admin = await Admin.findOne({ email }).select("+password");
        if (!admin) {
            return res.status(401).json({ message: "Admin not found" });
        }
        // Compare entered password with hashed one
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        admin.lastSeen = Date.now();
        await admin.save();

        // Generate JWT
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/active-admins", async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeAdmins = await Admin.find({ lastSeen: { $gte: fiveMinutesAgo } });
        res.status(200).json(activeAdmins);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/admins", async (req, res) => {
    try {
        const { role } = req.query;
        const query = role ? { role } : {};
        const admins = await Admin.find(query);
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete('/admin/:id', async (req, res) => {
    try {
        await Admin.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Admin deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.put('/admin/:id', async (req, res) => {
    try {
        const { name, role } = req.body;
        const updated = await Admin.findByIdAndUpdate(
            req.params.id,
            { name, role },
            { new: true }
        );
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


module.exports = router;