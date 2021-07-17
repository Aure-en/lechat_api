const express = require('express');
const activityController = require('../controllers/activityController');

const router = express.Router();

// POST to create a document to track an user's activity
router.post('/', activityController.activity_create);

// GET the activity of a specific user
router.get('/:userId', activityController.activity_user);

// PUT to update the activity of a specific user
// POST to update the activity with navigator.sendBeacon()
router.put(
  '/:userId/servers',
  activityController.activity_update_server,
  activityController.activity_update_channel,
);

router.post(
  '/:userId/servers',
  activityController.activity_update_server,
  activityController.activity_update_channel,
);

router.put('/:userId/conversations', activityController.activity_update_conversation);

router.post('/:userId/conversations', activityController.activity_update_conversation);

// DELETE to delete a user's activity
router.delete('/:userId', activityController.activity_delete);

module.exports = router;
