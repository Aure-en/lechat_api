const express = require('express');
const checkAuth = require('../auth/checkAuth');
const friendController = require('../controllers/friendController');

const router = express.Router();

// Check that the user is logged-in before handling friends
router.use('/friends', checkAuth.check_user);

// Accept a friend request
router.put('/friends/:friendId', friendController.friend_accept);

// Decline request or remove a friend
router.delete('/friends/:friendId', friendController.friend_delete);
