const async = require('async');
const { body, validationResult } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const Activity = require('../models/activity');

// Create a document to start tracking the user's activity.
exports.activity_create = (req, res, next) => {
  const activity = new Activity({
    _id: req.body.user,
    servers: [],
    conversations: [],
  });

  activity.save((err) => {
    if (err) return next(err);
    return res.redirect(303, activity.url);
  });
};

// Update the activity when the user visits a server
exports.activity_update_server = [
  // Validation
  body('server', 'Server must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),

  // Check for errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    next();
  },

  // Update the servers array.
  (req, res, next) => {
    if (!isValidObjectId(req.body.server)) return res.json({ error: 'Invalid id.' });
    Activity.findOneAndUpdate(
      { _id: req.params.userId, 'servers._id': { $ne: req.body.server } },
      {
        $push: {
          servers: {
            _id: req.body.server,
            channels: [],
          },
        },
      },
    ).exec((err) => {
      if (err) return next(err);
      next();
    });
  },
];

exports.activity_update_channel = [
  // Validation
  body('channel', 'Channel must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),

  // Check for errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    next();
  },

  (req, res, next) => {
    if (!isValidObjectId(req.body.server) || !isValidObjectId(req.body.channel)) return res.json({ error: 'Invalid id.' });
    async.parallel(
      [
        // Update the channel activity if it already exists in the channels array.
        (callback) => {
          Activity.findOneAndUpdate(
            {
              _id: req.params.userId,
            },
            {
              $set: {
                'servers.$[server].channels.$[channel].timestamp': Date.now(),
              },
            },
            {
              arrayFilters: [{ 'server._id': req.body.server }, { 'channel._id': req.body.channel }],
            },
          ).exec(callback);
        },

        // Push the channel in the channels array if it isn't in it yet.
        (callback) => {
          Activity.findOneAndUpdate(
            {
              _id: req.params.userId,
              'servers._id': req.body.server,
              'servers.channels._id': { $ne: req.body.channel },
            },
            {
              $push: {
                'servers.$.channels': {
                  _id: req.body.channel,
                  timestamp: Date.now(),
                },
              },
            },
          ).exec(callback);
        },
      ],
      (err) => {
        if (err) return next(err);
        return res.redirect(303, `/activity/${req.params.userId}`);
      },
    );
  },
];

// Update the activity when the user visits a conversation
exports.activity_update_conversation = [
  // Validation
  body('conversation', 'Conversation must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),

  // Check for errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    next();
  },

  // Update the conversations array.
  (req, res, next) => {
    if (!isValidObjectId(req.body.conversation)) return res.json({ error: 'Invalid id.' });
    async.parallel(
      [
        // Update the conversation activity if it already exists in the array.
        (callback) => {
          Activity.findOneAndUpdate(
            {
              _id: req.params.userId,
              'conversations._id': req.body.conversation,
            },
            {
              $set: {
                'conversations.$': {
                  _id: req.body.conversation,
                  timestamp: Date.now(),
                },
              },
            },
          ).exec(callback);
        },

        // Push the conversation in the conversations array if it isn't in it yet.
        (callback) => {
          Activity.findOneAndUpdate(
            {
              _id: req.params.userId,
              'conversations._id': { $ne: req.body.conversation },
            },
            {
              $push: {
                conversations: {
                  _id: req.body.conversation,
                  timestamp: Date.now(),
                },
              },
            },
          ).exec(callback);
        },
      ],
      (err) => {
        if (err) return next(err);
        return res.redirect(303, `/activity/${req.params.userId}`);
      },
    );
  },
];

// Remove a room from the user's activity
exports.activity_delete = (req, res, next) => {
  Activity.findOneAndDelete({ _id: req.params.userId }).exec((err) => {
    if (err) return next(err);
    return res.json({ success: 'Activity deleted.' });
  });
};

// Get the user's activity (full list)
exports.activity_user = (req, res, next) => {
  Activity.findOne({ _id: req.params.userId })
    .populate('conversations')
    .exec((err, activity) => {
      if (err) return next(err);
      if (!activity) return res.status(404).json({ error: 'Activity not found' });
      return res.json(activity);
    });
};
