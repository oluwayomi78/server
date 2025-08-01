const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/signup", authController.signupPage);
router.post("/signup", authController.signup);

router.get("/login", authController.loginPage);
router.post("/login", authController.login);

router.get("/profile",  authController.getCurrentUser);

module.exports = router;
