const express = require('express');
const checkAuth = require('../auth/checkAuth');

const router = express.Router();
const serverController = require('../controllers/serverController');
const categoryController = require('../controllers/categoryController');
const channelController = require('../controllers/channelController');
const messageController = require('../controllers/messageController');

// GET all servers
router.get('/', serverController.server_list);

// POST to create a new server
router.post(
  '/',
  checkAuth.check_user,
  serverController.server_create,
);

// PUT to update a server
router.put(
  '/:serverId',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  serverController.server_update,
);

// DELETE a server
router.delete(
  '/:serverId',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  serverController.server_delete,
);

// GET a specific server
router.get('/:serverId', serverController.server_detail);

// POST to create a new category
router.post(
  '/:serverId/categories',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  categoryController.category_create,
);

// GET to get the server categories
router.get('/:serverId/categories', categoryController.category_list);

// POST to create a channel in a category
router.post(
  '/:serverId/categories/:categoryId/channels',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  channelController.channel_create,
);

// POST to create a new message
router.post(
  '/:serverId/channels/:channelId/messages',
  checkAuth.check_user,
  messageController.message_create,
);

module.exports = router;
