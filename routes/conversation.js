const express = require('express');
const conversationController = require('../controllers/conversationController');

const router = express.Router();

// Get conversation details
router.get('/:conversationId', conversationController.conversation_detail);

// Get conversation messages
router.get(
  ':/conversationId/messages',
  conversationController.conversation_messages,
);

// Create a new conversation
router.post('/', conversationController.conversation_create);

module.exports = router;
