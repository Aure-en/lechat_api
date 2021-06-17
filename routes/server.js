const express = require('express');
const checkAuth = require('../auth/checkAuth');
const upload = require('../middleware/upload');

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
  upload.image,
  checkAuth.check_user,
  serverController.server_create,
);

// POST to create a new message
router.post(
  '/:serverId/channels/:channelId/messages',
  checkAuth.check_user,
  messageController.message_create,
);

// GET to get the server categories
router.get('/:serverId/categories', categoryController.category_list);

// GET the server messages
router.get('/:serverId/messages', serverController.server_messages);

// GET server members
router.get('/:serverId/members', serverController.server_members);

// GET a specific server
router.get('/:serverId', serverController.server_detail);

// Check permissions for CUD Operations on the server.
router.use(
  '/:serverId/*',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
);

// PUT to update a server
router.put(
  '/:serverId',
  upload.image,
  serverController.server_update,
);

router.delete(
  '/:serverId/icon',
  upload.image,
  serverController.server_remove_icon,
);

// DELETE a server
router.delete(
  '/:serverId',
  checkAuth.check_user,
  checkAuth.check_admin,
  checkAuth.check_permission,
  serverController.server_delete,
);

// POST to create a new category
router.post(
  '/:serverId/categories',
  categoryController.category_create,
);

// POST to create a channel in a category
router.post(
  '/:serverId/categories/:categoryId/channels',
  channelController.channel_create,
);

module.exports = router;
