const { body, validationResult } = require('express-validator');
const async = require('async');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// POST Login
exports.auth_login = [
  body('identifier', 'Email / Username must be specified.')
    .trim()
    .isLength({ min: 1 }),
  body('password', 'Password must be specified').trim().isLength({ min: 1 }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json(errors);
    }

    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.json({
          errors: [
            {
              value: '',
              param: 'response',
              location: 'body',
              msg: info.message,
            },
          ],
        });
      }

      User.findOne({ _id: user._id })
        .populate('avatar')
        .exec((err, user) => {
          if (err) return next(err);
          req.login(user, { session: false }, (err) => {
            if (err) res.send(err);
            // Generate a JWT with the contents of user object
            const token = jwt.sign(user._id.toJSON(), process.env.JWT_SECRET);
            return res.json({ user, token });
          });
        });
    })(req, res);
  },
];

// POST Sign up
exports.auth_signup = [
  body('username', 'Username must be specified').trim().isLength({ min: 1 }),
  body('email')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Email must be specified')
    .isEmail()
    .withMessage('Invalid email.'),
  body('password', 'Password must be specified').trim().isLength({ min: 1 }),

  // Check for errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json(errors);
    }
    return next();
  },

  // Check if email or username is already taken
  (req, res, next) => {
    const errors = [];

    async.parallel([
      (callback) => {
        User.findOne({ email: req.body.email }).exec((err, user) => {
          if (err) return next(err);
          if (user) {
            errors.push(
              {
                value: '',
                msg: 'Email is already taken.',
                param: 'email',
                location: 'body',
              },
            );
          }
          callback();
        });
      },

      (callback) => {
        User.findOne({ username: req.body.username }).exec((err, user) => {
          if (err) return next(err);
          if (user) {
            errors.push(
              {
                value: '',
                msg: 'Username is already taken.',
                param: 'username',
                location: 'body',
              },
            );
          }
          callback();
        });
      },
    ], () => {
      if (errors.length > 0) {
        return res.json({ errors });
      }
      return next();
    });
  },

  // Everything is fine, save the user.
  (req, res, next) => {
    // Hash password and save the user in the database
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      if (err) return next(err);
      new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      }).save((err, user) => {
        if (err) return next(err);
        // Login the user and generates the token
        req.login(user, { session: false }, (err) => {
          if (err) return next(err);
          // Generate a JWT with the contents of user object
          const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET);
          return res.json({ user, token });
        });
      });
    });
  },
];

// Used to tell the client their JWT is still valid.
exports.auth_check = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, userId) => {
    if (err) return next(err);
    if (!userId) {
      return res
        .status(401)
        .json({ error: 'Invalid user.' });
    }
    return res.json({ success: 'Valid user.' });
  })(req, res, next);
};
