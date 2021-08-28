const async = require('async');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { isValidObjectId } = require('mongoose');
const Server = require('../models/server');
const User = require('../models/user');
const Message = require('../models/message');
const Channel = require('../models/channel');
const Category = require('../models/category');
const File = require('../models/file');
const queries = require('../utils/queries');

// List of all servers (GET)
exports.server_list = (req, res, next) => {
  const limit = req.query.limit || 12;
  Server.find({ ...queries.setPagination(req.query) }, 'name icon about')
    .populate('icon')
    .sort(queries.setSort(req.query))
    .limit(limit * 1) // Convert to number
    .exec((err, servers) => {
      if (err) return next(err);
      return res.json(servers);
    });
};

// Detail of a specific server (GET)
exports.server_detail = (req, res, next) => {
  if (!isValidObjectId(req.params.serverId)) {
    return res.json({ error: 'Invalid server id.' });
  }
  Server.findOne({ _id: req.params.serverId })
    .populate('icon')
    .exec((err, server) => {
      if (!server) return res.json({ error: 'Server not found' });
      if (err) return next(err);
      return res.json(server);
    });
};

// List all messages in a server (GET)
exports.server_messages = (req, res, next) => {
  if (!isValidObjectId(req.params.serverId)) {
    return res.json({ error: 'Invalid server id.' });
  }
  const limit = req.query.limit || 100;
  Message.find({
    server: req.params.serverId,
    ...queries.setQueries(req.query),
    ...queries.setPagination(req.query),
  })
    .sort({ timestamp: -1 })
    .limit(limit * 1) // Convert to number
    .populate('files')
    .populate({
      path: 'author',
      select: 'username avatar',
      populate: {
        path: 'avatar',
        model: 'File',
      },
    })
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
  if (!isValidObjectId(req.params.serverId)) {
    return res.json({ error: 'Invalid server id.' });
  }
  User.find({ server: req.params.serverId }, 'username avatar')
    .populate('avatar')
    .exec((err, users) => {
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
  async (req, res, next) => {
    const data = {
      name: req.body.name,
      admin: req.user._id.toString(),
      about: req.body.about,
      rules: req.body.rules,
      timestamp: Date.now(),
    };

    // If there is no icon, save the server.
    if (!req.file) {
      const server = new Server(data);

      async.parallel(
        [
          // Save the server
          (callback) => {
            server.save(callback);
          },

          // Add the server to the user's server list
          (callback) => {
            User.findByIdAndUpdate(
              req.user._id.toString(),
              { $push: { server: server._id } },
              {},
            ).exec(callback);
          },
        ],
        (err) => {
          if (err) return next(err);
          return res.redirect(303, server.url);
        },
      );
    }

    /**
     * If there is an image, the server icon will be updated.
     * 1. Resize it and temporarily save it in /temp.
     * 2. Save the image in a File document
     * 3. Add the image to the future server's data.
     * 4. Save the server and add it the user's server list.
     */

    // 1. Resize the image and save it.
    const file = {
      name: req.file.filename,
      data: fs.readFileSync(
        path.join(__dirname, `../temp/${req.file.filename}`),
      ),
      contentType: req.file.mimetype,
    };

    // If the file is huge, create a thumbnail that will be displayed instead.
    if (req.file.size > 5000) {
      await sharp(path.join(__dirname, `../temp/${req.file.filename}`))
        .resize(300, 300, {
          fit: sharp.fit.cover,
        })
        .toFormat('webp')
        .toFile(path.join(__dirname, `../temp/sm-${req.file.filename}`));
      file.data = fs.readFileSync(
        path.join(__dirname, `../temp/sm-${req.file.filename}`),
      );

      // Delete the image after using it
      fs.unlink(
        path.join(__dirname, `../temp/sm-${req.file.filename}`),
        (err) => {
          if (err) throw err;
        },
      );
    }
    // Delete the image from the disk after using it
    fs.unlink(
      path.join(__dirname, `../temp/${req.file.filename}`),
      (err) => {
        if (err) throw err;
      },
    );

    // 2. Save the image in a file document.
    const serverIcon = new File(file);
    serverIcon.save((err, saved) => {
      if (err) return next(err);

      // 3. Add the file document _id to the server data.
      data.icon = saved._id;

      // 4. Save the server
      const server = new Server(data);

      async.parallel(
        [
          // Save the server
          (callback) => {
            server.save(callback);
          },

          // Add the server to the user's server list
          (callback) => {
            User.findByIdAndUpdate(
              req.user._id.toString(),
              { $push: { server: server._id } },
              {},
            ).exec(callback);
          },
        ],
        (err) => {
          if (err) return next(err);
          return res.redirect(303, server.url);
        },
      );
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
  async (req, res, next) => {
    const server = {
      name: req.body.name,
      about: req.body.about,
    };

    // If there are no files, simply save the server with
    // a new name and description.
    if (!req.file) {
      Server.findByIdAndUpdate(
        req.params.serverId,
        server,
        {},
        (err, server) => {
          if (err) return next(err);
          return res.redirect(303, server.url);
        },
      );
    }

    /**
     * If there is an image, the server icon will be updated.
     * 1. Temporarily save the file in /temp and extracts its data.
     * 2. Resize the image as much as possible.
     * 3. Save the image in a File document
     * 4. Update the server with all the new information
     * 5. If the server already had an avatar, delete the previous File document.
     */

    // 1. Temporarily saves the image and extracts the data
    const icon = {
      name: req.file.filename,
      data: fs.readFileSync(
        path.join(__dirname, `../temp/${req.file.filename}`),
      ),
      contentType: req.file.mimetype,
    };

    // 2. If the file is huge, resize it.
    if (req.file.size > 5000) {
      await sharp(path.join(__dirname, `../temp/${req.file.filename}`))
        .resize(300, 300, {
          fit: sharp.fit.cover,
        })
        .toFormat('webp')
        .toFile(path.join(__dirname, `../temp/sm-${req.file.filename}`));
      icon.data = fs.readFileSync(
        path.join(__dirname, `../temp/sm-${req.file.filename}`),
      );

      // Delete the thumbnail after using it
      fs.unlink(
        path.join(__dirname, `../temp/sm-${req.file.filename}`),
        (err) => {
          if (err) throw err;
        },
      );
    }

    // Delete the image from the disk after using it
    fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
      if (err) throw err;
    });

    async.waterfall([
      // 3. Save the image in a File document.
      (callback) => {
        const serverIcon = new File(icon);
        serverIcon.save((err, saved) => {
          if (err) return next(err);
          callback(null, saved.id);
        });
      },

      // 4. Update the server icon with the new image
      (iconId, callback) => {
        server.icon = iconId;
        Server.findByIdAndUpdate(
          req.params.serverId,
          server,
          {},
          (err, server) => {
            if (err) return next(err);
            callback(null, server);
          },
        );
      },

      /* 5. If the server already had an icon
       * → Delete the previous file used as the server icon.
       * Send back the new server object.
       */
      (server, callback) => {
        if (server.icon) {
          File.deleteOne({ _id: server.icon }).exec((err) => {
            if (err) return next(err);
            callback(null, server);
          });
        } else {
          callback(null, server);
        }
      },
    ], (err, server) => {
      if (err) return next(err);

      /**
       * Use a redirect there because server contains the previous
       * data (before update), so that the previous File document
       * can be found with the _id and deleted.
       */
      return res.redirect(303, server.url);
    });
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
        Server.findByIdAndRemove(req.params.serverId, async (err, server) => {
          if (err) return next(err);

          // Delete server icon file if there was one
          if (server.icon) {
            File.deleteOne({ _id: server.icon }).exec(callback);
          } else {
            callback();
          }
        });
      },
    ],
    (err) => {
      if (err) return next(err);
      return res.redirect(303, '/servers');
    },
  );
};
