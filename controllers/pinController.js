const Pin = require('../models/pin');

exports.pin_create = (req, res, next) => {
  const pin = new Pin({
    room: req.body.room,
    messages: [],
  });

  pin.save((err) => {
    if (err) return next(err);
    return res.json({ success: 'Pin created.' });
  });
};

exports.pin_add = (req, res, next) => {
  Pin.findOneAndUpdate(
    { room: req.params.roomId },
    { $addToSet: { messages: req.params.messageId } },
  ).exec((err) => {
    if (err) return next(err);
    return res.json({ success: 'Pin added.' });
  });
};

exports.pin_remove = (req, res, next) => {
  Pin.findOneAndUpdate(
    { room: req.params.roomId },
    { $unset: { messages: req.params.messageId } },
  ).exec((err) => {
    if (err) return next(err);
    return res.json({ success: 'Pin removed.' });
  });
};

exports.pin_delete = (req, res, next) => {
  Pin.findOneAndDelete({ room: req.params.roomId }).exec((err) => {
    if (err) return next(err);
    return res.json({ success: 'Pin deleted.' });
  });
};
