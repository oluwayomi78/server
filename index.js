const express = require("express");
const app = express();
const cors = require("cors");
const ejs = require("ejs");
require("dotenv").config();
const mongoose = require("mongoose");

// Import routes and controllers
const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const authController = require("./controllers/authController");
const adminRoutes = require("./routes/adminRoutes");
const paystackRoutes = require("./routes/paystackRoutes");

// Configure middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const uri = process.env.URI || "mongodb+srv://preciousenoch459";
const port = process.env.PORT || 5000;


// console.log("✅ JWT_SECRET from .env:", process.env.JWT_SECRET);


// Use routes (define before DB connect for clarity)
app.use("/", authRoutes);
app.use("/auth", otpRoutes);
app.use("/admin", adminRoutes);
app.use("/api/paystack", paystackRoutes);
// Direct route for dashboard user fetch
app.get("/getCurrentUser", authController.getCurrentUser);

// Connect to MongoDB and start the server only AFTER the connection is successful
mongoose.connect(uri)
    .then(() => {
        console.log("🔹Database connected successfully");
        // Start the server here, inside the .then() block
        app.listen(port, () => {
            console.log(`🔹Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error(" 🔹Database connection failed:", err);
        // Exit the process if the database connection fails
        process.exit(1);
    });