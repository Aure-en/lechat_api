const express = require('express');
const checkAuth = require('../auth/checkAuth');
const conversationController = require('../controllers/conversationController');
const messageController = require('../controllers/messageController');
const pinController = require('../controllers/pinController');

const router = express.Router();

// Get members conversation if it exists
router.get('/', conversationController.conversation_existence);

// Create a new conversation
router.post('/', conversationController.conversation_create);

// Get conversation details
router.get('/:conversationId', conversationController.conversation_detail);

router.use(
  '/:conversationId/*',
  checkAuth.check_user,
  conversationController.conversation_permission,
);

// Get conversation messages
router.get(
  '/:conversationId/messages',
  conversationController.conversation_messages,
);

// Create a new conversation message
router.post(
  '/:conversationId/messages',
  messageController.message_create,
);

// -- Pins --
// POST to create the pin document
router.post(
  '/:conversationId/pins',
  pinController.pin_create,
);

// DELETE to delete the pin document
router.delete(
  '/:conversationId/pins',
  pinController.pin_delete,
);

// POST to add a pin
router.post(
  '/:conversationId/pins/:messageId',
  pinController.pin_add,
);

// DELETE to remove a pin
router.delete(
  '/:conversationId/pins/:messageId',
  pinController.pin_remove,
);

module.exports = router;
