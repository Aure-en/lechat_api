const passport = require('passport');
const bcrypt = require('bcryptjs');
const Server = require('../models/server');
const Category = require('../models/category');
const Channel = require('../models/channel');
const Message = require('../models/message');
const User = require('../models/user');

// Check that the user is logged in
exports.check_user = function (req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res
        .status(401)
        .json({ error: 'Only registered users may perform this action.' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Check that the user is the administrator (only them can delete the server).
exports.check_admin = function (req, res, next) {
  // If the user already has permission, no need to check.
  if (res.locals.isAllowed) return next();

  switch (req.baseUrl) {
    case '/servers':
      Server.findById(req.params.serverId).exec((err, server) => {
        if (err) return next(err);
        if (!server) return res.json({ error: 'Server not found.' });
        if (req.user._id === server.admin.toString()) {
          res.locals.isAllowed = true;
        }
        next();
      });
      break;

    case '/categories':
      Category.findById(req.params.categoryId)
        .populate('server')
        .exec((err, category) => {
          if (err) return next(err);
          if (!category) return res.json({ error: 'Category not found.' });
          if (req.user._id === category.server.admin.toString()) {
            res.locals.isAllowed = true;
          }
          next();
        });
      break;

    case '/channels':
      Channel.findById(req.params.channelId)
        .populate('server')
        .exec((err, channel) => {
          if (err) return next(err);
          if (!channel) return res.json({ error: 'Category not found.' });
          if (req.user._id === channel.server.admin.toString()) {
            res.locals.isAllowed = true;
          }
          next();
        });
      break;

    case '/messages':
      Message.findById(req.params.messageId)
        .populate('server')
        .exec((err, message) => {
          if (err) return next(err);
          if (!message) return res.json({ error: 'Message not found.' });
          if (req.user._id === message.server.admin.toString()) {
            res.locals.isAllowed = true;
          }
          next();
        });
      break;
    default:
      return next();
  }
};

// Check if the user is the message author
exports.check_author = function (req, res, next) {
  // If the user already has permission, no need to check.
  if (res.locals.isAllowed) return next();
  Message.findById(req.params.messageId).exec((err, message) => {
    if (err) return next(err);
    if (!message) {
      return res.json({ error: 'Message not found.' });
    }
    if (req.user._id === message.author.toString()) {
      res.locals.isAllowed = true;
    }
    return next();
  });
};

// Check the user identity
exports.check_user_id = function (req, res, next) {
  if (req.user._id === req.params.userId) {
    next();
  } else {
    res.status(403).json({ error: 'You do not have permission to perform this operation.' });
  }
};

// Check if res.locals.isAllowed = true
exports.check_permission = function (req, res, next) {
  if (!res.locals.isAllowed) {
    return res
      .status(403)
      .json({
        error: 'You do not have the permission to perform this operation.',
      });
  }
  return next();
};
