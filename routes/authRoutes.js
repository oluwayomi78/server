const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const verifyToken = require("../middlewares/verifyToken"); 

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/signup", authController.signupPage);
router.post("/signup", authController.signup);

router.get("/login", authController.loginPage);
router.post("/login", authController.login);

router.get("/profile", verifyToken, authController.getCurrentUser);
router.put("/updateUser", verifyToken, authController.updateUser);
router.post("/fetchUserAccountName",  authController.fetchUserAccountName);
router.post("/setPin", verifyToken, authController.setPin);
router.post("/verifyPin", verifyToken, authController.verifyPin);
router.post("/transferFunds", verifyToken, authController.transferFunds);
router.post("/airtime", verifyToken, authController.airtime);
router.get("/transactions", verifyToken, authController.getTransactionHistory);
router.post("/data", verifyToken, authController.data);
router.post("/betting", verifyToken, authController.betting);
router.post("/tv", verifyToken, authController.tv);
router.post("/safebox", verifyToken, authController.safebox);
router.post("/loan", verifyToken, authController.loan);
router.get("/getLoans", verifyToken, authController.getLoans);
router.post("/invitation", authController.Invitation);
router.post("/notification", verifyToken, authController.notification);
router.get("/notification", verifyToken, authController.getNotifications);
router.patch("/markNotificationAsRead/:id", verifyToken, authController.markAsRead);
router.get("/logout", authController.logout);
module.exports = router;