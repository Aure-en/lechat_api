const express = require('express');
const checkAuth = require('../auth/checkAuth');
const conversationController = require('../controllers/conversationController');
const messageController = require('../controllers/messageController')

const router = express.Router();

// Get members conversation if it exists
router.get('/', conversationController.conversation_existence);

// Get conversation details
router.get('/:conversationId', conversationController.conversation_detail);

// Get conversation messages
router.get(
  '/:conversationId/messages',
  conversationController.conversation_messages,
);

// Create a new conversation
router.post('/', conversationController.conversation_create);

// Create a new conversation message
router.post('/:conversationId/messages', checkAuth.check_user, messageController.message_create);

module.exports = router;
