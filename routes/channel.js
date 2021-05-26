const express = require('express');
const checkAuth = require('../auth/checkAuth');
const channelController = require('../controllers/channelController');

const router = express.Router({ mergeParams: true });

// GET a specific channel
router.get(
  '/:channelId', channelController.channel_detail,
);

// PUT to update a channel
router.put(
  '/:channelId',
  checkAuth.check_user,
  checkAuth.check_admin,
  channelController.channel_update,
);

// DELETE a channel
router.delete(
  '/:channelId',
  checkAuth.check_user,
  checkAuth.check_admin,
  channelController.channel_delete,
);

module.exports = router;
