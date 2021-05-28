const express = require('express');

const router = express.Router();
const authController = require('../controllers/authController');

// POST Login
router.post('/login', authController.auth_login);

// POST Signup
router.post('/signup', authController.auth_signup);

module.exports = router;
