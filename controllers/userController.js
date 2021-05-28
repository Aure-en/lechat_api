const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Detail of a specific user (GET)
exports.user_detail = function (req, res, next) {
  User.findOne({ _id: req.params.userId }).exec((err, user) => {
    if (err) return next(err);
    if (!user) {
      res.json({ error: 'User not found. ' });
    }
    return res.json(user);
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

    // Check if the username is already taken
    User.findOne({ username: req.body.username }).exec((err, user) => {
      if (err) return next(err);
      if (user) {
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
    });

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

exports.user.update_password = [
  // Validation

  // Empty fields
  body('current_password', 'Current password must be specified')
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

  // Password confirmation.
  body('confirm_password').custom((value, { req, res }) => {
    if (!value !== req.body.new_password) {
      res.json({
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
  }),

  // Everything is fine. Saves password.
  (req, res, next) => {
    bcrypt.hash(req.body.new_password, 10, (err, hashedPassword) => {
      if (err) return next(err);
      User.findByIdAndUpdate(req.params.userId, { password: hashedPassword }, {}, (err, user) => {
        if (err) return next(err);
        return res.redirect(303, user.url);
      });
    });
  },
];

exports.user.update_email = [
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

  // Check if email is already taken
  (req, res, next) => {
    User.findOne({ email: req.body.email }).exec((err, user) => {
      if (err) return next(err);
      if (user) {
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
    });
    next();
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

// Delete a user
exports.user_delete = function (req, res, next) {
  // Only the user themself can delete their account
  if (req.user._id !== req.params.userId) {
    res
      .status(403)
      .json({ error: 'You do not have permission to perform this operation.' });
  }

  User.findByIdAndRemove(req.params.userId, (err) => {
    if (err) return next(err);
    res.json({ sucess: 'Account has been deleted.' });
  });
};
