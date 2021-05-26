const express = require('express');
const messageController = require('../controllers/messageController');

const router = express.Router({ mergeParams: true });

// GET a specific message
router.get('/:messageId', messageController.message_detail);

// PUT to update a message
router.put('/:messageId', messageController.message_update);

// DELETE a message
router.delete('/:message', messageController.message_delete);

module.exports = router;
