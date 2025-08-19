require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../models/adminModels');

const admins = [
    { name: "PRECIOUS ENOCH ABIODUN", email: "preciousenoch48@gmail.com", password: "2580147", role: "manager" },
    { name: "Super Admin", email: "super@bank.com", password: "pass12333", role: "superadmin" },
    { name: "Manager One", email: "manager1@bank.com", password: "pass2333", role: "manager" },
    { name: "Support Agent", email: "support@bank.com", password: "pass33333", role: "support" },
    { name: "Customer Care", email: "customer@bank.com", password: "pass4333", role: "customer" },
    { name: "babatunde bright", email: "bright@gmail.com", password: "123456", role: "manager" }, 
    { name: "Olawale ", email: "devgentle412@gmail.com", password: "123456", role: "manager" }, 
    { name: "Oluwasegun", email: "oluwasegun@gmail.com", password: "123456", role: "manager" }
];

const uri = process.env.URI;

mongoose.connect(uri)
    .then(async () => {
        console.log("✅ Database connected successfully");
        try {
            for (const admin of admins) {
                const { name, email, password, role } = admin;
                const hashedPassword = await bcrypt.hash(password, 10);

                await Admin.updateOne(
                    { email: email },
                    { $set: { name, email, role, password: hashedPassword } },
                    { upsert: true }
                );

                console.log(`✅ Admin created or updated: ${email}`);
            }

            process.exit(0);
        } catch (error) {
            console.error("❌ Error creating admin:", error);
            process.exit(1);
        }
    })
    .catch((err) => {
        console.error("❌ Database connection failed:", err);
        process.exit(1);
    });