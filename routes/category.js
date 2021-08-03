const express = require('express');
const checkAuth = require('../auth/checkAuth');
const categoryController = require('../controllers/categoryController');
const channelController = require('../controllers/channelController');

const router = express.Router({ mergeParams: true }); // mergeParams is necessary to get serverId.
// GET a specific category
router.get('/:categoryId', categoryController.category_detail);

// GET to get all the channels in a category
router.get('/:categoryId/channels', channelController.channel_list);

// Permissions for incoming routes
router.use(
  '/:categoryId',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
);

// PUT to update a category
router.put(
  '/:categoryId',
  categoryController.category_update,
);

// DELETE a category
router.delete(
  '/:categoryId',
  categoryController.category_delete,
);

module.exports = router;
