const { body, validationResult } = require('express-validator');
const async = require('async');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');
const User = require('../models/user');
const Server = require('../models/server');
const Friend = require('../models/friend');

// Detail of a specific user (GET)
exports.user_detail = (req, res, next) => {
  User.findOne({ _id: req.params.userId }, 'username email avatar server')
    .populate('server')
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
    .populate('server')
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
  if (req.file) {
    // Temporarily saves the image and extracts the data
    const avatar = {
      name: req.file.filename,
      data: fs.readFileSync(
        path.join(__dirname, `../temp/${req.file.filename}`),
      ),
      contentType: req.file.mimetype,
    };

    // If the file is huge, create a thumbnail that will be displayed instead.
    if (req.file.size > 5000) {
      await sharp(path.join(__dirname, `../temp/${req.file.filename}`))
        .resize(
          64,
          64,
          {
            fit: sharp.fit.cover,
          },
        )
        .toFile(path.join(__dirname, `../temp/sm-${req.file.filename}`));
      avatar.thumbnail = fs.readFileSync(path.join(__dirname, `../temp/sm-${req.file.filename}`));

      // Delete the image after using it
      fs.unlink(path.join(__dirname, `../temp/sm-${req.file.filename}`), (err) => {
        if (err) throw err;
      });
    }

    // Delete the image from the disk after using it
    fs.unlink(path.join(__dirname, `../temp/${req.file.filename}`), (err) => {
      if (err) throw err;
    });

    // Save the image
    User.findByIdAndUpdate(req.params.userId, { avatar }, {}, (err, user) => {
      if (err) return next(err);
      res.redirect(303, user.url);
    });
  } else {
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
          User.findByIdAndRemove(req.params.userId, callback);
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
