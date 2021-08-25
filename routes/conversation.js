const express = require('express');
const checkAuth = require('../auth/checkAuth');
const conversationController = require('../controllers/conversationController');
const messageController = require('../controllers/messageController');
const upload = require('../middleware/upload');

const router = express.Router();

// Get members conversation if it exists
router.get('/', conversationController.conversation_existence);

// Create a new conversation
router.post('/', conversationController.conversation_create);

// Get conversation details
router.get('/:conversationId', conversationController.conversation_detail);

// Create a new conversation message
router.post(
  '/:conversationId/messages',
  upload.files,
  checkAuth.check_user,
  checkAuth.check_conversation,
  messageController.message_create,
);

// Get conversation messages
router.get(
  '/:conversationId/messages',
  checkAuth.check_user,
  checkAuth.check_conversation,
  conversationController.conversation_messages,
);

module.exports = router;
