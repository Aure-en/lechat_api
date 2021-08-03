const express = require('express');
const checkAuth = require('../auth/checkAuth');
const channelController = require('../controllers/channelController');
const pinController = require('../controllers/pinController');

const router = express.Router({ mergeParams: true });

// GET a specific channel
router.get('/:channelId', channelController.channel_detail);

// PUT to update a channel
router.put(
  '/:channelId',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  channelController.channel_update,
);

// DELETE a channel
router.delete(
  '/:channelId',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  channelController.channel_delete,
);

// GET to read all the messages in a channel
router.get('/:channelId/messages', channelController.channel_messages);

// -- Pins --
// POST to create the pin document
router.use(
  ['/:channelId/pins', '/:channelId/pins/*'],
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
);

router.post(
  '/:channelId/pins',
  pinController.pin_create,
);

// DELETE to delete the pin document
router.delete(
  '/:channelId/pins',
  pinController.pin_delete,
);

// POST to add a pin
router.post(
  '/:channelId/pins/:messageId',
  pinController.pin_add,
);

// DELETE to remove a pin
router.delete(
  '/:channelId/pins/:messageId',
  pinController.pin_remove,
);

module.exports = router;
