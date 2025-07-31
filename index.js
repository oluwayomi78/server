const express = require("express");
const app = express();
const cors = require("cors");
const ejs = require("ejs");
require("dotenv").config();
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const uri = process.env.URI || "mongodb+srv://preciousenoch459";
const port = process.env.PORT || 5000;

mongoose.connect(uri)
.then(() => console.log("Database connected successfully"))
.catch((err) => console.error("Database connection failed:", err));

app.use("/", authRoutes);
app.use("/auth", otpRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
