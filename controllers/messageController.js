const Message = require('../models/message');

// Helper functions to search for specific messages
const setQueries = (options) => {
  const queries = {};
  const {
    search, channel, author, before, after, file,
  } = options;

  if (search) {
    queries.text = { $regex: options.search, $options: 'i' };
  }

  if (author) {
    queries.author = options.author;
  }

  if (channel) {
    queries.channel = options.channel;
  }

  if (after) {
    queries.timestamp = { $gt: options.after };
  }

  if (before) {
    queries.timestamp = { $lt: options.before };
  }

  if (file) {
    queries.file = { $exists: true };
  }
  return queries;
};

// List all messages in a server (GET)
exports.message_list_server = function (req, res, next) {
  Message.find({ server: req.params.serverId, ...setQueries(req.query) })
    .populate('author')
    .populate({
      path: 'reaction',
      populate: {
        path: 'emote',
        model: 'Emote',
      },
    }).exec((err, messages) => {
      if (err) return next(err);
      return res.json(messages);
    });
};

// List all messages in a channel (GET)
exports.message_list_channel = function (req, res, next) {
  Message.find({ channel: req.params.channelId })
    .populate('author')
    .populate({
      path: 'reaction',
      populate: {
        path: 'emote',
        model: 'Emote',
      },
    }).exec((err, messages) => {
      if (err) return next(err);
      return res.json(messages);
    });
};

// Details of a specific message (GET)
exports.message_detail = function (req, res, next) {
  Message.findById(req.params.messageId)
    .populate('author')
    .populate({
      path: 'reaction',
      populate: {
        path: 'emote',
        model: 'Emote',
      },
    }).exec((err, message) => {
      if (err) return next(err);
      if (!message) {
        return res.json({ error: 'Message not found.' });
      }
      return res.json(message);
    });
};

// Create a message (POST)
exports.message_create = function (req, res, next) {
  const message = new Message({
    author: req.user._id,
    text: req.body.text,
    timestamp: Date.now(),
    server: req.params.serverId,
    channel: req.params.channelId,
  });

  message.save((err) => {
    if (err) return next(err);
    res.redirect(303, message.url);
  });
};

// Update a message (PUT)
exports.message_update = function (req, res, next) {
  Message.findByIdAndUpdate(
    req.params.messageId,
    { text: req.body.text, edited: true },
    {},
    (err, message) => {
      if (err) return next(err);
      res.redirect(303, message.url);
    },
  );
};

// Delete a message
exports.message_delete = function (req, res, next) {
  Message.findByIdAndRemove(req.params.messageId, (err, message) => {
    if (err) return next(err);
    res.redirect(303, `/channels/${message.channel}/messages`);
  });
};

// Add a reaction to the message (POST)
exports.message_add_reaction = [
  (req, res, next) => {
    Message.findById(req.params.messageId, 'reaction').exec((err, result) => {
      if (err) return next(err);
      res.locals.message = result;
      next();
    });
  },

  (req, res, next) => {
    // If the reaction is already in the message, push the user in the list of users who reacted.
    if (
      res.locals.message.reaction
      && res.locals.message.reaction.filter(
        (reaction) => reaction.emote.toString() === req.params.emoteId,
      ).length > 0
    ) {
      let reactions = res.locals.message.reaction;
      reactions = reactions.map((reaction) => {
        if (reaction.emote.toString() === req.params.emoteId) {
          if (!reaction.users.includes(req.user._id)) reaction.users.push(req.user._id);
        }
        return reaction;
      });

      Message.findByIdAndUpdate(req.params.messageId, {
        reaction: reactions,
      }).exec((err, updated) => {
        if (err) return next(err);
        return res.redirect(303, updated.url);
      });
    } else {
      // Else, create the reaction field.
      Message.findByIdAndUpdate(req.params.messageId, {
        $push: {
          reaction: {
            emote: req.params.emoteId,
            users: [req.user._id],
          },
        },
      }).exec((err, updated) => {
        if (err) return next(err);
        res.redirect(303, updated.url);
      });
    }
  },
];

// Remove a reaction from the message (DELETE)
exports.message_delete_reaction = [
  (req, res, next) => {
    Message.findById(req.params.messageId, 'reaction').exec((err, result) => {
      if (err) return next(err);
      res.locals.message = result;
      next();
    });
  },

  // If the user was the only one using this emote, remove the field.
  (req, res, next) => {
    if (
      res.locals.message.reaction[
        res.locals.message.reaction.findIndex(
          (reaction) => reaction.emote.toString() === req.params.emoteId,
        )
      ].users.length < 2
    ) {
      Message.findByIdAndUpdate(req.params.messageId, {
        $pull: { reaction: { emote: req.params.emoteId } },
      }).exec((err, updated) => {
        if (err) return next(err);
        res.redirect(303, updated.url);
      });
    } else {
      // Else, pull the user from the array of users using this emote
      let reactions = res.locals.message.reaction;
      reactions = reactions.map((reaction) => {
        if (reaction.emote.toString() === req.params.emoteId) {
          return {
            emote: reaction.emote,
            users: reaction.users.filter((user) => user.toString() !== req.user._id),
          };
        }
        return reaction;
      });

      Message.findByIdAndUpdate(req.params.messageId, {
        reaction: reactions,
      }).exec((err, updated) => {
        if (err) return next(err);
        res.redirect(303, updated.url);
      });
    }
  },
];

