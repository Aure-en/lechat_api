const async = require('async');
const { body, validationResult } = require('express-validator');
const Server = require('../models/server');
const User = require('../models/user');
const Message = require('../models/message');
const Channel = require('../models/channel');

// List of all servers (GET)
exports.server_list = function (req, res, next) {
  Server.find({}, 'name').exec((err, servers) => {
    if (err) return next(err);
    return res.json(servers);
  });
};

// Detail of a specific server (GET)
exports.server_detail = function (req, res, next) {
  Server.find({ _id: req.params.serverId }).exec((err, server) => {
    if (err) return next(err);
    if (!server) return res.json({ error: 'Server not found' });
    return res.json(server);
  });
};

// Create a server (POST)
exports.server_create = [
  // Validation
  body('name', 'Name must be specified').trim().isLength({ min: 1 }).escape(),

  // Check for errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // There are errors. Send them.
      return res.json({ errors: errors.array() });
    }
    next();
  },

  // Form is valid. Save the server.
  (req, res, next) => {
    const server = new Server({ name: req.body.name });
    server.save((err) => {
      if (err) return next(err);
      return res.redirect(303, server.url);
    });
  },
];

// Update a server (PUT)
exports.server_update = [
  // Validation
  body('name', 'Name must be specified').trim().isLength({ min: 1 }).escape(),

  // Check for errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // There are errors. Send them.
      return res.json({ errors: errors.array() });
    }
    next();
  },

  // Form is valid. Save the server.
  (req, res, next) => {
    Server.findByIdAndUpdate(req.params.serverId, { name: req.body.name }, {}, (err, server) => {
      if (err) return next(err);
      res.redirect(303, server.url);
    });
  },
];

// Delete a server (DELETE)
exports.server_delete = function (req, res, next) {
  async.parallel([
    // Delete the server messages
    function (callback) {
      Message.deleteMany({ server: req.params.serverId }).exec(callback);
    },

    // Delete the server channels
    function (callback) {
      Channel.deleteMany({ server: req.params.serverId }).exec(callback);
    },

    // Delete the server from the users servers list.
    function (callback) {
      User.updateMany(
        { server: req.params.serverId },
        { $pull: { server: req.params.serverId } },
      ).exec(callback);
    },

    // Delete the server itself
    function (callback) {
      Server.findByIdAndDelete(req.params.serverId).exec(callback);
    },
  ], (err) => {
    if (err) return next(err);
    res.redirect(303, '/servers');
  });
};

// Check that the user is the administrator (only them can delete the server).
exports.check_admin = function (req, res, next) {
  Server.findById(req.params.serverId).exec((err, server) => {
    if (err) return next(err);
    if (!server) return res.json({ error: 'Server not found. ' });
    if (req.user._id !== server.admin.toString()) {
      return res.status(403).json({ error: 'Only the administrator can delete the server. ' });
    }
    next();
  });
};
