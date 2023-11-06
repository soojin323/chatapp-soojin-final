const express = require("express");
const {
  registerUser,
  login,
  handleResetEmail,
  handleResetToken,
  handleResetPW,
  findUser,
} = require("../controllers/userController.js");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/reset", handleResetEmail);
router.get("/reset/:resetToken", handleResetToken);
router.post("/reset/:resetToken", handleResetPW);
router.get("/find/:userId", findUser);
module.exports = router;
