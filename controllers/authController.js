const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// POST Login
exports.auth_login_post = [
  body('email').trim().isLength({ min: 1 }).withMessage('Email must be specified')
    .isEmail()
    .withMessage('Invalid email.'),
  body('password', 'Password must be specified').trim().isLength({ min: 1 }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.json(errors);
      return;
    }

    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.json({
          errors: [{
            value: '',
            param: 'response',
            location: 'body',
            msg: info.message,
          }],
        });
      }
      req.login(user, { session: false }, (err) => {
        if (err) res.send(err);
        // Generate a JWT with the contents of user object
        const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET);
        return res.json({ user, token });
      });
    })(req, res);
  },
];

exports.auth_signup_post = [
  body('username', 'Username must be specified').trim().isLength({ min: 1 }),
  body('email').trim().isLength({ min: 1 }).withMessage('Email must be specified')
    .isEmail()
    .withMessage('Invalid email.'),
  body('password', 'Password must be specified').trim().isLength({ min: 1 }),

  // Check for errors
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
