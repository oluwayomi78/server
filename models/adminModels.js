const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Admin name is required"],
        },
        email: {
            type: String,
            required: [true, "Admin email is required"],
            unique: true,
            lowercase: true,
        },
        password: { 
            type: String, 
            required: true, 
            select: false ,
        },
        role: {
            type: String,
            enum: ["superadmin", "manager", "support"],
            default: "manager",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        lastLogin: {
        type: Date
        },
    },
    {
        timestamps: true,
    }
);

// 🔐 Hash password before saving
adminSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model("Admin", adminSchema);
