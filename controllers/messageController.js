const Message = require('../models/message');

// Details of a specific message (GET)
exports.message_detail = (req, res, next) => {
  Message.findById(req.params.messageId)
    .populate('author', 'username')
    .populate({
      path: 'reaction',
      populate: {
        path: 'emote',
        model: 'Emote',
      },
    })
    .exec((err, message) => {
      if (err) return next(err);
      if (!message) {
        return res.json({ error: 'Message not found.' });
      }
      return res.json(message);
    });
};

// Create a message (POST)
exports.message_create = (req, res, next) => {
  const data = {
    author: req.user._id.toString(),
    text: req.body.text,
    timestamp: Date.now(),
  };

  if (req.params.serverId && req.params.channelId) {
    data.server = req.params.serverId;
    data.channel = req.params.channelId;
  } else if (req.params.conversationId) {
    data.conversation = req.params.conversationId;
  }

  const message = new Message(data);

  message.save((err) => {
    if (err) return next(err);
    return res.redirect(303, message.url);
  });
};

// Update a message (PUT)
exports.message_update = (req, res, next) => {
  Message.findByIdAndUpdate(
    req.params.messageId,
    { text: req.body.text, edited: true },
    {},
    (err, message) => {
      if (err) return next(err);
      return res.redirect(303, message.url);
    },
  );
};

// Delete a message
exports.message_delete = (req, res, next) => {
  Message.findByIdAndRemove(req.params.messageId, (err) => {
    if (err) return next(err);
    return res.json({ success: 'Message deleted.' });
  });
};

// Add a reaction to the message (POST)
exports.message_add_reaction = [
  (req, res, next) => {
    Message.findById(req.params.messageId, 'reaction').exec((err, result) => {
      if (err) return next(err);
      res.locals.message = result;
      return next();
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
          if (!reaction.users.includes(req.user._id.toString())) reaction.users.push(req.user._id.toString());
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
            users: [req.user._id.toString()],
          },
        },
      }).exec((err, updated) => {
        if (err) return next(err);
        return res.redirect(303, updated.url);
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
      return next();
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
            users: reaction.users.filter(
              (user) => user.toString() !== req.user._id.toString(),
            ),
          };
        }
        return reaction;
      });

      Message.findByIdAndUpdate(req.params.messageId, {
        reaction: reactions,
      }).exec((err, updated) => {
        if (err) return next(err);
        return res.redirect(303, updated.url);
      });
    }
  },
];
