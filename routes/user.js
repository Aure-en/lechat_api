const express = require('express');
const checkAuth = require('../auth/checkAuth');
const userController = require('../controllers/userController');
const friendController = require('../controllers/friendController');
const conversationController = require('../controllers/conversationController');
const upload = require('../middleware/upload');

const router = express.Router({ mergeParams: true });

// GET to search for an user
router.get('/', userController.user_search);

// GET a specific user detail
router.get('/:userId', userController.user_detail);

// POST to add a friend
router.post(
  '/:userId/friends',
  checkAuth.check_user,
  friendController.friend_add,
);

// Check permission (only users themselves can modify their details)
router.use(
  '/:userId/*',
  checkAuth.check_user,
  checkAuth.check_user_id,
);

// GET user servers
router.get('/:userId/servers', userController.user_server);

// GET a user conversations
router.get('/:userId/conversations', conversationController.conversation_list);

// PUT to update an user details
router.put(
  '/:userId/password',
  userController.user_update_password,
);

router.put(
  '/:userId/email',
  userController.user_update_email,
);

router.put(
  '/:userId/username',
  userController.user_update_username,
);

router.put(
  '/:userId/avatar',
  upload.image,
  userController.user_update_avatar,
);

// POST to join a server
router.post(
  '/:userId/servers/:serverId',
  userController.user_server_join,
);

// GET to see all friends
router.get(
  '/:userId/friends',
  friendController.friend_list,
);

// GET to see all pending friend requests
router.get(
  '/:userId/pending',
  friendController.friend_list_pending,
);

// DELETE to leave a server
router.delete(
  '/:userId/servers/:serverId',
  userController.user_server_leave,
);

// DELETE an user account
router.delete(
  '/:userId',
  checkAuth.check_user,
  checkAuth.check_user_id,
  userController.user_delete,
);

module.exports = router;
