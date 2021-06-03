const { body, validationResult } = require('express-validator');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const queries = require('../utils/queries');

// List a conversation informations
exports.conversation_detail = function (req, res, next) {
  Conversation.findById(req.params.conversationId).exec((err, conversation) => {
    if (err) return next(err);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found. ' });
    return res.json(conversation);
  });
};

// List all the conversations of a specific user (GET)
exports.conversation_list = function (req, res, next) {
  Conversation.find({ members: req.user._id }, '_id').exec(
    (err, conversations) => {
      if (err) return next(err);
      return res.json(conversations);
    },
  );
};

// List messages from a conversation (GET)
exports.conversation_messages = function (req, res, next) {
  const limit = req.query.limit || 100;
  Message.find({
    conversation: req.params.conversationId,
    ...queries.setQueries(req.query),
    ...queries.setPagination(req.query),
  })
    .sort({ timestamp: -1 })
    .limit(limit * 1) // Convert to number
    .populate('author', 'username _id')
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

// Create a conversation (POST)
exports.conversation_create = [
  // Validation
  body('members').custom((value) => {
    if (JSON.parse(value).length < 2) {
      throw new Error('There must be at least two users in the conversation');
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

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
