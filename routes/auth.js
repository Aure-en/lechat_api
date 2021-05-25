const express = require("express");

const router = express.Router();
const authController = require("../controllers/authController");

// POST Login
router.post("/login", authController.auth_login_post);

// POST Signup
router.post("/signup", authController.auth_signup_post);

module.exports = router;
