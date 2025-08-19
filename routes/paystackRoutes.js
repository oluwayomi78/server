const express = require("express");
const router = express.Router();
const paystackController = require("../controllers/paystackController");

router.post("/create-recipient", paystackController.createRecipient);
router.post("/make-transfer", paystackController.makeTransfer);

module.exports = router;
