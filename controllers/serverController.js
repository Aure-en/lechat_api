const async = require('async');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
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
  Server.findOne({ _id: req.params.serverId }).exec((err, server) => {
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
    const server = new Server({
      name: req.body.name,
      admin: req.user._id,
      timestamp: Date.now(),
    });

    async.parallel([
      // Save the server
      function(callback) {
        server.save(callback);
      },

      // Add the server to the user's server list
      function(callback) {
        User.findByIdAndUpdate(
          req.user._id,
          { $push: { server: server._id } },
          {},
        ).exec(callback);
      },
    ], (err) => {
      if (err) return next(err);
      return res.redirect(303, server.url);
    });
  },
];

// Update a server (PUT)
exports.server_update_name = [
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
    Server.findByIdAndUpdate(
      req.params.serverId,
      { name: req.body.name },
      {},
      (err, server) => {
        if (err) return next(err);
        res.redirect(303, server.url);
      },
    );
  },
];

exports.server_update_icon = (req, res, next) => {
  if (req.file) {
    // Temporarily saves the image and extracts the data
    const icon = {
      name: req.file.filename,
      data: fs.readFileSync(
        path.join(__dirname, `../temp/${req.file.filename}`),
      ),
      contentType: req.file.mimetype,
    };

    // Delete the image from the disk after using it
    fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
      if (err) throw err;
    });

    // Save the image
    Server.findByIdAndUpdate(req.params.serverId, { icon }, {}, (err, server) => {
      if (err) return next(err);
      res.redirect(303, server.url);
    });
  } else {
    // Remove the icon
    Server.findByIdAndUpdate(
      req.params.serverId,
      { $unset: { icon: '' } },
      {},
      (err, server) => {
        if (err) return next(err);
        res.redirect(303, server.url);
      },
    );
  }
};

// Delete a server (DELETE)
exports.server_delete = function (req, res, next) {
  async.parallel(
    [
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
    ],
    (err) => {
      if (err) return next(err);
      res.redirect(303, '/servers');
    },
  );
};
