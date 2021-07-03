const express = require('express');
const activityController = require('../controllers/activityController');

const router = express.Router();

// POST to create a document to track an user's activity
router.post('/', activityController.activity_create);

// GET the activity of a specific user
router.get('/:userId', activityController.activity_user);

// PUT to update the activity of a specific user
router.put('/:userId/rooms/:roomId', activityController.activity_update);

module.exports = router;
