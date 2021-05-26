const express = require('express');
const checkAuth = require('../auth/checkAuth');
const categoryController = require('../controllers/categoryController');
const channelController = require('../controllers/channelController');

const router = express.Router({ mergeParams: true }); // mergeParams is necessary to get serverId.

// PUT to update a category
router.put(
  '/:categoryId',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  categoryController.category_update,
);

// DELETE a category
router.delete(
  '/:categoryId',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  categoryController.category_delete,
);

// GET a specific category
router.get(
  '/:categoryId', categoryController.category_detail,
);

// GET to get all the channels in a category
router.get(
  '/:categoryId/channels',
  channelController.channel_list,
);

module.exports = router;
