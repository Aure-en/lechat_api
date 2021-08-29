const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Message = require('../models/message');
const File = require('../models/file');

// Details of a specific message (GET)
exports.message_detail = (req, res, next) => {
  Message.findById(req.params.messageId)
    .exec((err, message) => {
      if (err) return next(err);
      if (!message) {
        return res.json({ error: 'Message not found.' });
      }
      return res.json(message);
    });
};

// Create a message (POST)
exports.message_create = async (req, res, next) => {
  /**
   * Timestamp is needed because to identify a message.
   * - In the front end, when the author sends a messages,
   *   it is displayed before being sent to the DB.
   * - After it is sent to the DB, it is identified on
   *   the front-end by its id and replaced.
   */
  const data = {
    author: req.user._id.toString(),
    text: req.body.text,
    timestamp: req.body.timestamp || Date.now(),
  };

  if (req.params.serverId && req.params.channelId) {
    data.server = req.params.serverId;
    data.channel = req.params.channelId;
  } else if (req.params.conversationId) {
    data.conversation = req.params.conversationId;
  }

  /* If there are files:
   * 1. Save them as File object (with a thumbnail if the file is an image)
   * 2. Add the resulting ObjectIds to the message data.files.
   * 3. Save the message.
   */
  if (req.files?.length > 0) {
    const files = [];
    await Promise.all(req.files.map(async (file) => {
      const fileData = {
        name: file.filename,
        data: fs.readFileSync(path.join(__dirname, `../temp/${file.filename}`)),
        contentType: file.mimetype,
        size: file.size,
      };

      /**
       * Create thumbnail if:
       * - The file is an image
       * - The image is big (> 5kB)
       */
      if (file.mimetype.split('/')[0] === 'image' && file.size > 5000) {
        await sharp(path.join(__dirname, `../temp/${file.filename}`))
          .resize(
            64,
            64,
            {
              fit: sharp.fit.cover,
            },
          )
          .toFormat('webp')
          .toFile(path.join(__dirname, `../temp/sm-${file.filename}`));
        fileData.thumbnail = fs.readFileSync(path.join(__dirname, `../temp/sm-${file.filename}`));

        // Delete the thumbnail from the disk after using it
        fs.unlink(path.join(__dirname, `../temp/sm-${file.filename}`), (err) => {
          if (err) throw err;
        });
      }

      // Delete the images from the disk after using it
      fs.unlink(path.join(__dirname, `../temp/${file.filename}`), (err) => {
        if (err) throw err;
      });

      const fileObj = new File(fileData);

      const toFiles = await fileObj.save();
      files.push(toFiles._id);
    }));
    data.files = files;
  }

  const message = new Message(data);

  message.save((err) => {
    if (err) return next(err);
    return res.status(201).json(message);
  });
};

// Update a message (PUT)
exports.message_update = (req, res, next) => {
  Message.findByIdAndUpdate(
    req.params.messageId,
    { text: req.body.text, edited: true },
    { new: true },
    (err, message) => {
      if (err) return next(err);
      return res.json(message);
    },
  );
};

// Delete a message
exports.message_delete = (req, res, next) => {
  Message.findByIdAndRemove(req.params.messageId, async (err, message) => {
    if (err) return next(err);

    // Delete all the files linked to the message.
    await Promise.all(message.files.map(async (file) => {
      File.deleteOne({ _id: file._id });
    }));

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
          if (!reaction.users.includes(req.user._id.toString())) {
            reaction.users.push(req.user._id.toString());
          }
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

// Pin a message
exports.message_pin = (req, res, next) => {
  Message.findByIdAndUpdate(
    req.params.messageId, { pinned: true }, { new: true },
  ).exec((err, message) => {
    if (err) return next(err);
    return res.json(message);
  });
};

// Unpin a message
exports.message_unpin = (req, res, next) => {
  Message.findByIdAndUpdate(
    req.params.messageId, { pinned: false }, { new: true },
  ).exec((err, message) => {
    if (err) return next(err);
    return res.json(message);
  });
};
