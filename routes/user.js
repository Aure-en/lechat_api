const express = require('express');
const checkAuth = require('../auth/checkAuth');
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

const router = express.Router();

// GET a specific user detail
router.get('/:userId', userController.user_detail);

// Check permission (only users themselves can modify their details)
router.use(
  '/:userId/*',
  checkAuth.check_user,
  checkAuth.check_user_id,
);

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
