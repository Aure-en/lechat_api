const express = require('express');
const checkAuth = require('../auth/checkAuth');
const pinController = require('../controllers/pinController');

const router = express.Router({ mergeParams: true });

// GET to read all the pins in a room
router.get('/:roomId/pins', pinController.pin_list);

// POST to create a pin document for a room
router.post('/:roomId/pins', pinController.pin_create);

// DELETE to delete a pin document for a room
router.delete('/:roomId/pins', pinController.pin_delete);

// POST to add a message to a room's pins
router.post('/:roomId/pins/:messageId', pinController.pin_add);

// DELETE to remove a message from a room's pins
router.delete('/:roomId/pins/:messageId', pinController.remove);

module.exports = router;
