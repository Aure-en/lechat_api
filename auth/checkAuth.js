const passport = require('passport');
const Category = require('../models/category');
const Channel = require('../models/channel');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Server = require('../models/server');
const User = require('../models/user');

// Check that the user is logged in
exports.check_user = (req, res, next) => {
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
exports.check_admin = (req, res, next) => {
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
exports.check_author = (req, res, next) => {
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
exports.check_user_id = (req, res, next) => {
  if (req.user._id.toString() === req.params.userId) {
    next();
  } else {
    res.status(403).json({ error: 'You do not have permission to perform this operation.' });
  }
};

// Check if the user is a member of a conversation
exports.check_conversation = (req, res, next) => {
  Conversation.findById(req.params.conversationId, 'members').exec(
    (err, conversation) => {
      if (err) return next(err);
      if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
      if (!conversation.members.includes(req.user._id)) {
        return res
          .status(403)
          .json({ error: 'You cannot access this conversation.' });
      }
      next();
    },
  );
};

// Check if the user can pin a message
exports.check_pin = (req, res, next) => {
  Message.findById(req.params.messageId).exec((err, message) => {
    if (err) return next(err);
    if (!message) return res.status(404).json({ error: 'Message not found.' });

    // If the message was posted in a private conversation,
    // Check that the current user is a member of the conversation
    if (message.conversation) {
      Conversation.findById(message.conversation).exec((err, conversation) => {
        if (err) return next(err);
        if (!conversation.members.includes(req.user._id.toString())) {
          return res.status(403).json({ error: 'You do not have permission to execute this operation.' });
        }
        return next();
      });
    }

    // If the message was posted in a server
    // Check that the current user is the admin of the server
    if (message.server) {
      Server.findById(message.server).exec((err, server) => {
        if (err) return next(err);
        if (!server) return res.json({ error: 'Server not found.' });
        if (req.user._id.toString() !== server.admin.toString()) {
          return res.status(403).json({ error: 'You do not have permission to execute this operation.' });
        }
        return next();
      });
    }
  });
};

// Check if res.locals.isAllowed = true
exports.check_permission = (req, res, next) => {
  if (!res.locals.isAllowed) {
    return res
      .status(403)
      .json({
        error: 'You do not have the permission to perform this operation.',
      });
  }
  return next();
};
