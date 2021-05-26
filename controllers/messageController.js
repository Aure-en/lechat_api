const Message = require('../models/message');

// List all messages in a server (GET)
exports.message_list_server = function (req, res, next) {
  Message.find({ server: req.params.serverId }).exec((err, messages) => {
    if (err) return next(err);
    return res.json(messages);
  });
};

// List all messages in a channel (GET)
exports.message_list_channel = function (req, res, next) {
  Message.find({ channel: req.params.channelId }).exec((err, messages) => {
    if (err) return next(err);
    return res.json(messages);
  });
};

// Details of a specific message (GET)
exports.message_detail = function (req, res, next) {
  Message.findById(req.params.messageId).exec((err, message) => {
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
    timestamp: new Date(),
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
    { text: req.body.text },
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
