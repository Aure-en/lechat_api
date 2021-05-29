const express = require('express');
const checkAuth = require('../auth/checkAuth');
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

const router = express.Router();

// PUT to update an user details
router.put(
  '/:userId/password',
  checkAuth.check_user,
  checkAuth.check_user_id,
  userController.user_update_password,
);

router.put(
  '/:userId/email',
  checkAuth.check_user,
  checkAuth.check_user_id,
  userController.user_update_email,
);

router.put(
  '/:userId/username',
  checkAuth.check_user,
  checkAuth.check_user_id,
  userController.user_update_username,
);

router.put(
  '/:userId/avatar',
  upload.image,
  checkAuth.check_user,
  checkAuth.check_user_id,
  userController.user_update_avatar,
);

// DELETE an user account
router.delete(
  '/:userId',
  checkAuth.check_user,
  checkAuth.check_user_id,
  userController.user_delete,
);

// GET a specific user detail
router.get('/:userId', userController.user_detail);

module.exports = router;
