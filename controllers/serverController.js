const async = require('async');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const Server = require('../models/server');
const User = require('../models/user');
const Message = require('../models/message');
const Channel = require('../models/channel');
const Category = require('../models/category');
const queries = require('../utils/queries');

// List of all servers (GET)
exports.server_list = (req, res, next) => {
  Server.find({}, 'name').exec((err, servers) => {
    if (err) return next(err);
    return res.json(servers);
  });
};

// Detail of a specific server (GET)
exports.server_detail = (req, res, next) => {
  Server.findOne({ _id: req.params.serverId }).exec((err, server) => {
    if (err) return next(err);
    if (!server) return res.json({ error: 'Server not found' });
    return res.json(server);
  });
};

// List all messages in a server (GET)
exports.server_messages = (req, res, next) => {
  const limit = req.query.limit || 100;
  Message.find({
    server: req.params.serverId,
    ...queries.setQueries(req.query),
    ...queries.setPagination(req.query),
  })
    .sort({ timestamp: 1 })
    .limit(limit * 1) // Convert to number
    .populate('author', 'username _id avatar')
    .populate({
      path: 'reaction',
      populate: {
        path: 'emote',
        model: 'Emote',
      },
    })
    .exec((err, messages) => {
      if (err) return next(err);
      return res.json(messages);
    });
};

// List all members in a server (GET)
exports.server_members = (req, res, next) => {
  User.find({ server: req.params.serverId }).exec((err, users) => {
    if (err) return next(err);
    return res.json(users);
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

  // Form is valid.
  (req, res, next) => {
    const data = {
      name: req.body.name,
      admin: req.user._id,
      about: req.body.about,
      rules: req.body.rules,
      timestamp: Date.now(),
    };

    // Add image field if there is an image
    if (req.file) {
      data.icon = {
        name: req.file.filename,
        data: fs.readFileSync(path.join(__dirname, `../temp/${req.file.filename}`)),
        contentType: req.file.mimetype,
      };
      // Delete the image from the disk after using it
      fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
        if (err) throw err;
      });
    }

    const server = new Server(data);

    async.parallel([
      // Save the server
      (callback) => {
        server.save(callback);
      },

      // Add the server to the user's server list
      (callback) => {
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
    return next();
  },

  // Form is valid. Save the server.
  (req, res, next) => {
    const server = {
      name: req.body.name,
      about: req.body.about,
    };

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
      server.icon = icon;
    }

    Server.findByIdAndUpdate(
      req.params.serverId,
      server,
      {},
      (err, server) => {
        if (err) return next(err);
        return res.redirect(303, server.url);
      },
    );
  },
];

exports.server_remove_icon = (req, res, next) => {
  Server.findByIdAndUpdate(
    req.params.serverId,
    { $unset: { icon: '' } },
    {},
    (err, server) => {
      if (err) return next(err);
      return res.redirect(303, server.url);
    },
  );
};

// Delete a server (DELETE)
exports.server_delete = (req, res, next) => {
  async.parallel(
    [
      // Delete the server messages
      (callback) => {
        Message.deleteMany({ server: req.params.serverId }).exec(callback);
      },

      // Delete the server channels
      (callback) => {
        Channel.deleteMany({ server: req.params.serverId }).exec(callback);
      },

      // Delete the server categories
      (callback) => {
        Category.deleteMany({ server: req.params.serverId }).exec(callback);
      },

      // Delete the server from the users servers list.
      (callback) => {
        User.updateMany(
          { server: req.params.serverId },
          { $pull: { server: req.params.serverId } },
        ).exec(callback);
      },

      // Delete the server itself
      (callback) => {
        Server.findByIdAndDelete(req.params.serverId).exec(callback);
      },
    ],
    (err) => {
      if (err) return next(err);
      return res.redirect(303, '/servers');
    },
  );
};
