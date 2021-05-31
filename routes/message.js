const express = require('express');
const checkAuth = require('../auth/checkAuth');
const messageController = require('../controllers/messageController');

const router = express.Router({ mergeParams: true });

// GET a specific message
router.get('/:messageId', messageController.message_detail);

// PUT to update a message
router.put(
  '/:messageId',
  checkAuth.check_user,
  checkAuth.check_author,
  checkAuth.check_permission,
  messageController.message_update,
);

// DELETE a message
router.delete(
  '/:messageId',
  checkAuth.check_user,
  checkAuth.check_author,
  checkAuth.check_admin,
  checkAuth.check_permission,
  messageController.message_delete,
);

module.exports = router;