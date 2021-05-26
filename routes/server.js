const express = require('express');
const checkAuth = require('../auth/checkAuth');

const router = express.Router();
const serverController = require('../controllers/serverController');
const categoryRouter = require('./category');
const channelRouter = require('./channel');

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
  serverController.server_update,
);

// DELETE a server
router.delete(
  '/:serverId',
  checkAuth.check_user,
  checkAuth.check_admin,
  serverController.server_delete,
);

// GET a specific server
router.get('/:serverId', serverController.server_detail);

// Requests for categories
router.use('/:serverId/categories', categoryRouter);

// Request for channels
router.use('/:serverId/channels', channelRouter);

module.exports = router;
