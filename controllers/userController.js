const { body, validationResult } = require('express-validator');
const async = require('async');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const User = require('../models/user');
const Server = require('../models/server');
const Friend = require('../models/friend');
const File = require('../models/file');

// Detail of a specific user (GET)
exports.user_detail = (req, res, next) => {
  User.findOne({ _id: req.params.userId }, 'username email avatar server')
    .populate('server')
    .populate('avatar')
    .exec((err, user) => {
      if (err) return next(err);
      if (!user) {
        res.json({ error: 'User not found.' });
      }
      return res.json(user);
    });
};

// Search for a user from their username or email (GET)
exports.user_search = (req, res, next) => {
  if (!req.query.search) return res.json({ error: 'Search query must not be empty.' });
  User.findOne({
    $or: [{ username: req.query.search }, { email: req.query.search }],
  }).exec((err, user) => {
    if (err) return next(err);
    if (!user) return res.json({ error: 'User not found.' });
    return res.json(user);
  });
};

// List user servers (GET)
exports.user_server = (req, res, next) => {
  User.findOne({ _id: req.params.userId }, 'server')
    .populate({
      path: 'server',
      populate: {
        path: 'icon',
        model: 'File',
      },
    })
    .exec((err, user) => {
      if (err) return next(err);
      if (!user) {
        res.json({ error: 'User not found.' });
      }
      return res.json(user.server);
    });
};

// Update an user
exports.user_update_username = [
  // Validation
  body('username', 'Username must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),

  (req, res, next) => {
    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    next();
  },

  // Check password
  (req, res, next) => {
    bcrypt.compare(req.body.password, req.user.password, (err, response) => {
      if (response) {
        return next();
      }
      return res.json({
        errors: [
          {
            value: '',
            msg: 'Incorrect password.',
            param: 'password',
            location: 'body',
          },
        ],
      });
    });
  },

  (req, res, next) => {
    // Check if the username is already taken
    User.findOne({ username: req.body.username }).exec((err, user) => {
      if (err) return next(err);
      if (user && user._id.toString() !== req.user._id.toString()) {
        return res.json({
          errors: [
            {
              value: '',
              msg: 'Username is already taken.',
              param: 'username',
              location: 'body',
            },
          ],
        });
      }
      next();
    });
  },

  (req, res, next) => {
    // Everything is fine. Saves username.
    User.findByIdAndUpdate(
      req.params.userId,
      { username: req.body.username },
      {},
      (err, user) => {
        if (err) return next(err);
        res.redirect(303, user.url);
      },
    );
  },
];

exports.user_update_password = [
  // Validation

  // Empty fields
  body('password', 'Current password must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('new_password')
    .trim()
    .isLength({ min: 1 })
    .withMessage('New password must be specified.')
    .escape(),
  body('confirm_password')
    .trim()
    .isLength({ min: 1 })
    .withMessage('New password must be confirmed.')
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    next();
  },

  // Check passwords
  (req, res, next) => {
    bcrypt.compare(req.body.password, req.user.password, (err, response) => {
      if (response) {
        return next();
      }
      return res.json({
        errors: [
          {
            value: '',
            msg: 'Incorrect password.',
            param: 'password',
            location: 'body',
          },
        ],
      });
    });
  },

  (req, res, next) => {
    if (req.body.confirm_password !== req.body.new_password) {
      return res.json({
        errors: [
          {
            value: '',
            msg: 'Passwords do not match.',
            param: 'new_password',
            location: 'body',
          },
          {
            value: '',
            msg: 'Passwords do not match.',
            param: 'confirm_password',
            location: 'body',
          },
        ],
      });
    }
    next();
  },

  // Everything is fine. Saves password.
  (req, res, next) => {
    bcrypt.hash(req.body.new_password, 10, (err, hashedPassword) => {
      if (err) return next(err);
      User.findByIdAndUpdate(
        req.params.userId,
        { password: hashedPassword },
        {},
        (err, user) => {
          if (err) return next(err);
          return res.redirect(303, user.url);
        },
      );
    });
  },
];

exports.user_update_email = [
  // Validation

  // Empty fields
  body('email')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Email must be specified')
    .isEmail()
    .withMessage('Invalid email.'),
  body('password', 'Password must be specified').trim().isLength({ min: 1 }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json(errors);
    }
    next();
  },

  // Check password
  (req, res, next) => {
    bcrypt.compare(req.body.password, req.user.password, (err, response) => {
      if (response) {
        return next();
      }
      return res.json({
        errors: [
          {
            value: '',
            msg: 'Incorrect password.',
            param: 'password',
            location: 'body',
          },
        ],
      });
    });
  },

  // Check if email is already taken
  (req, res, next) => {
    User.findOne({ email: req.body.email }).exec((err, user) => {
      if (err) return next(err);
      if (user && user._id.toString() !== req.user._id.toString()) {
        return res.json({
          errors: [
            {
              value: '',
              msg: 'Email is already taken.',
              param: 'email',
              location: 'body',
            },
          ],
        });
      }
      next();
    });
  },

  (req, res, next) => {
    // Everything is fine. Save the email.
    User.findByIdAndUpdate(
      req.params.userId,
      { email: req.body.email },
      {},
      (err, user) => {
        if (err) return next(err);
        res.redirect(303, user.url);
      },
    );
  },
];

exports.user_update_avatar = async (req, res, next) => {
  // If no file was sent, delete the avatar.
  if (!req.file) {
    // Remove the avatar
    User.findByIdAndUpdate(
      req.params.userId,
      { $unset: { avatar: '' } },
      {},
      (err, user) => {
        if (err) return next(err);
        res.redirect(303, user.url);
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
  const file = {
    name: req.file.filename,
    data: fs.readFileSync(path.join(__dirname, `../temp/${req.file.filename}`)),
    contentType: req.file.mimetype,
  };

  // 2. If the file is huge, create a data that will be displayed instead.
  if (req.file.size > 5000) {
    await sharp(path.join(__dirname, `../temp/${req.file.filename}`))
      .resize(64, 64, {
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
  fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
    if (err) throw err;
  });

  async.waterfall([
    // 3. Create a File document to save the file.
    (callback) => {
      const avatar = new File(file);

      avatar.save((err, saved) => {
        if (err) return next(err);
        callback(null, saved._id);
      });
    },

    // 4. Update the user avatar with the new file
    (avatarId, callback) => {
      User.findByIdAndUpdate(
        req.params.userId,
        { avatar: avatarId },
        {},
        (err, user) => {
          if (err) return next(err);
          callback(null, user);
        },
      );
    },

    /* 5. If the user already had an avatar
     * → Delete the previous file used as the user's avatar.
     * Send back the new user object.
     */
    (user, callback) => {
      if (user.avatar) {
        File.deleteOne({ _id: user.avatar }).exec((err) => {
          if (err) return next(err);
          callback(null, user);
        });
      } else {
        callback(null, user);
      }
    },
  ], (err, user) => {
    if (err) return next(err);

    /**
       * Use a redirect there because user contains the previous
       * data (before update), so that the previous File document
       * can be found with the _id and deleted.
       */
    return res.redirect(303, user.url);
  });
};

// Delete a user
exports.user_delete = [
  (req, res, next) => {
    bcrypt.compare(req.body.password, req.user.password, (err, response) => {
      if (response) {
        return next();
      }
      return res.json({
        errors: [
          {
            value: '',
            msg: 'Incorrect password.',
            param: 'password',
            location: 'body',
          },
        ],
      });
    });
  },

  (req, res, next) => {
    async.parallel(
      [
        // Delete all user friendships
        (callback) => {
          Friend.deleteMany({
            $or: [
              { sender: req.params.userId },
              { recipient: req.params.userId },
            ],
          }).exec(callback);
        },

        // Decrement server members
        (callback) => {
          User.findById(req.params.userId, 'server').exec((err, user) => {
            Server.updateMany(
              { _id: { $in: user.server } },
              { $inc: { members: -1 } },
            ).exec(callback);
          });
        },

        // Delete account
        (callback) => {
          User.findByIdAndUpdate(
            req.params.userId,
            { active: false },
            callback,
          );
        },
      ],
      (err) => {
        if (err) return next(err);
        res.json({ success: 'Account has been deleted.' });
      },
    );
  },
];

// User joins a server
exports.user_server_join = [
  // Check that the server exists
  (req, res, next) => {
    Server.findById(req.params.serverId).exec((err, server) => {
      if (err) return next(err);
      if (!server) return res.status(404).json({ error: 'Server not found.' });
    });
    next();
  },

  // Check that the user hasn't already joined the server
  (req, res, next) => {
    User.findById(req.params.userId, 'server').exec((err, user) => {
      if (user.server.includes(req.params.serverId)) return res.json({ error: 'Server already joined.' });
      next();
    });
  },

  (req, res, next) => {
    async.parallel(
      [
        // Join the server
        (callback) => {
          User.findByIdAndUpdate(
            req.params.userId,
            { $push: { server: req.params.serverId } },
            {},
          ).exec(callback);
        },

        // Increment server members
        (callback) => {
          Server.findByIdAndUpdate(
            req.params.serverId,
            { $inc: { members: 1 } },
            {},
          ).exec(callback);
        },
      ],
      (err) => {
        if (err) return next(err);
        res.redirect(303, `/users/${req.params.userId}`);
      },
    );
  },
];

// User leaves a server
exports.user_server_leave = (req, res, next) => {
  async.parallel(
    [
      // Remove the server from the user's server list.
      (callback) => {
        User.findByIdAndUpdate(
          req.params.userId,
          { $pull: { server: req.params.serverId } },
          {},
        ).exec(callback);
      },

      // Decrement server members
      (callback) => {
        Server.findByIdAndUpdate(
          req.params.serverId,
          { $inc: { members: -1 } },
          {},
        ).exec(callback);
      },
    ],
    (err) => {
      if (err) return next(err);
      res.redirect(303, `/users/${req.params.userId}`);
    },
  );
};
