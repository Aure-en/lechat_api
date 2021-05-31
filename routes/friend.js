const express = require('express');
const checkAuth = require('../auth/checkAuth');
const friendController = require('../controllers/friendController');

const router = express.Router({ mergeParams: true });

// Check that the user is logged-in before handling friends
router.use('/*', checkAuth.check_user);

// Accept a friend request
router.put('/:friendId', friendController.friend_accept);

// Decline request or remove a friend
router.delete('/:friendId', friendController.friend_delete);

module.exports = router;
