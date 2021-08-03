const { body, validationResult } = require('express-validator');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const queries = require('../utils/queries');

// List a conversation informations
exports.conversation_detail = (req, res, next) => {
  Conversation.findById(req.params.conversationId)
    .populate('members', 'username _id avatar')
    .exec((err, conversation) => {
      if (err) return next(err);
      if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
      return res.json(conversation);
    });
};

// Check existence of a conversation containing those members
exports.conversation_existence = (req, res, next) => {
  const members = req.query.members.split(',');
  Conversation.findOne({ members: { $all: members } })
    .populate('members', 'username _id avatar')
    .exec((err, conversation) => {
      if (err) return next(err);
      return res.json(conversation);
    });
};

// List all the conversations of a specific user (GET)
exports.conversation_list = (req, res, next) => {
  Conversation.find({ members: req.user._id }, '_id').populate('members', 'username _id avatar').exec(
    (err, conversations) => {
      if (err) return next(err);
      return res.json(conversations);
    },
  );
};

// List messages from a conversation (GET)
exports.conversation_messages = (req, res, next) => {
  const limit = req.query.limit || 100;
  Message.find({
    conversation: req.params.conversationId,
    ...queries.setQueries(req.query),
    ...queries.setPagination(req.query),
  })
    .sort({ timestamp: -1 })
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
      res.set('X-Total-Count', messages.length);
      return res.json(messages);
    });
};

// Create a conversation (POST)
exports.conversation_create = [
  // Validation
  body('members').custom((value) => {
    // Remove duplicate and make an array
    const members = Array.from(new Set(JSON.parse(value)));
    if (members.length < 2) {
      throw new Error('There must be at least two users in the conversation');
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    next();
  },

  // Check if the conversation already exists
  (req, res, next) => {
    Conversation.findOne({
      members: Array.from(new Set(JSON.parse(req.body.members))),
    }).exec((err, conversation) => {
      if (err) return next(err);
      if (conversation) return res.json(conversation);
      next();
    });
  },

  (req, res, next) => {
    // No errors, save the conversation
    const conversation = new Conversation({
      members: JSON.parse(req.body.members),
    });

    conversation.save((err, conversation) => {
      if (err) return next(err);
      return res.redirect(303, conversation.url);
    });
  },
];
