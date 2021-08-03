const passport = require('passport');
const Server = require('../models/server');
const Category = require('../models/category');
const Channel = require('../models/channel');
const Message = require('../models/message');
const User = require('../models/user');

// Check that the user is logged in
exports.check_user = function (req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, userId) => {
    if (err) return next(err);
    if (!userId) {
      return res
        .status(401)
        .json({ error: 'Only registered users may perform this action.' });
    }
    User.findOne({ _id: userId }).exec((err, user) => {
      req.user = user;
      next();
    });
  })(req, res, next);
};

// Check permissions in a server
exports.check_admin = function (req, res, next) {
  // If the user already has permission, no need to check.
  if (res.locals.isAllowed) return next();

  const base = req.baseUrl.split('/')[1];

  switch (base) {
    case 'servers':
      Server.findById(req.params.serverId).exec((err, server) => {
        if (err) return next(err);
        if (!server) return res.json({ error: 'Server not found.' });
        if (req.user._id.toString() === server.admin.toString()) {
          res.locals.isAllowed = true;
        }
        return next();
      });
      break;

    case 'categories':
      Category.findById(req.params.categoryId)
        .populate('server')
        .exec((err, category) => {
          if (err) return next(err);
          if (!category) return res.json({ error: 'Category not found.' });
          if (req.user._id.toString() === category.server.admin.toString()) {
            res.locals.isAllowed = true;
          }
          return next();
        });
      break;

    case 'channels':
      Channel.findById(req.params.channelId)
        .populate('server')
        .exec((err, channel) => {
          if (err) return next(err);
          if (!channel) return res.json({ error: 'Channel not found.' });
          if (req.user._id.toString() === channel.server.admin.toString()) {
            res.locals.isAllowed = true;
          }
          return next();
        });
      break;

    case 'messages':
      Message.findById(req.params.messageId)
        .populate('server')
        .exec((err, message) => {
          if (err) return next(err);
          if (!message) return res.json({ error: 'Message not found.' });
          if (req.user._id.toString() === message.server.admin.toString()) {
            res.locals.isAllowed = true;
          }
          return next();
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
    if (req.user._id.toString() === message.author.toString()) {
      res.locals.isAllowed = true;
    }
    return next();
  });
};

// Check the user identity
exports.check_user_id = function (req, res, next) {
  if (req.user._id.toString() === req.params.userId) {
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
