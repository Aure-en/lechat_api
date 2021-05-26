const express = require('express');
const checkAuth = require('../auth/checkAuth');

const router = express.Router({ mergeParams: true }); // mergeParams is necessary to get serverId.
const categoryController = require('../controllers/categoryController');
const channelController = require('../controllers/channelController');

// PUT to update a category
router.put(
  '/:categoryId',
  checkAuth.check_user,
  checkAuth.check_admin,
  categoryController.category_update,
);

// DELETE a category
router.delete(
  '/:categoryId',
  checkAuth.check_user,
  checkAuth.check_admin,
  categoryController.category_delete,
);

// GET a specific category
router.get(
  '/:categoryId', categoryController.category_detail,
);

// POST to create a channel in a category
router.post(
  '/:categoryId/channels', channelController.channel_create,
);

// GET to get all the channels in a category
router.get(
  '/:categoryId/channels',
  channelController.channel_list,
);

module.exports = router;
