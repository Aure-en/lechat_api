const { body, validationResult } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const Channel = require('../models/channel');
const Message = require('../models/message');
const queries = require('../utils/queries');

// List all channels of a server (GET)
exports.channel_list_server = (req, res, next) => {
  Channel.find({ server: req.params.serverId }).populate('category').exec((err, channels) => {
    if (err) return next(err);
    return res.json(channels);
  });
};

// List all channels of a category (GET)
exports.channel_list = (req, res, next) => {
  Channel.find({ category: req.params.categoryId }).exec((err, channels) => {
    if (err) return next(err);
    return res.json(channels);
  });
};

// Detail of a specific channel (GET)
exports.channel_detail = (req, res, next) => {
  if (!isValidObjectId(req.params.channelId)) return res.json({ error: 'Invalid id.' });
  Channel.findById(req.params.channelId).exec((err, channel) => {
    if (err) return next(err);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found.' });
    }
    return res.json(channel);
  });
};

// List all messages in a channel (GET)
exports.channel_messages = (req, res, next) => {
  if (!isValidObjectId(req.params.channelId)) return res.json({ error: 'Invalid id.' });
  const limit = req.query.limit || 100;
  Message.find({
    channel: req.params.channelId,
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

// Create a channel (POST)
exports.channel_create = [
  // Validation
  body('name', 'Name must be specified.').trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    return next();
  },

  (req, res, next) => {
    // There are no errors. Save the category.
    const channel = new Channel({
      name: req.body.name,
      category: req.params.categoryId,
      server: req.params.serverId,
      about: req.body.about,
      timestamp: Date.now(),
    });

    channel.save((err) => {
      if (err) return next(err);
      return res.redirect(303, channel.url);
    });
  },
];

// Update a channel (PUT)
exports.channel_update = [
  // Validation
  body('name', 'Name must be specified.').trim().isLength({ min: 1 }).escape(),
  body('category', 'Category must be specified.')
    .trim()
    .isLength({ min: 1 })
    .escape(),

  (req, res, next) => {
    // check for errors
    const errors = validationResult(req);
    // There are errors. Send them.
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    Channel.findByIdAndUpdate(
      req.params.channelId,
      { name: req.body.name, category: req.body.category, about: req.body.about },
      {},
      (err, channel) => {
        if (err) return next(err);
        // Use 303 status to redirect to GET.
        // Otherwise, it infinitely makes PUT requests.
        res.redirect(303, channel.url);
      },
    );
  },
];

// Delete a channel (DELETE)
exports.channel_delete = (req, res, next) => {
  Channel.findByIdAndRemove(req.params.channelId, (err, channel) => {
    if (err) return next(err);
    return res.redirect(303, `/categories/${channel.category}/channels`);
  });
};
