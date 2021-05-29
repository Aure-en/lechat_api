const Friend = require('../models/friend');

// List all of the user friends
exports.friend_list = function (req, res, next) {
  Friend.find({
    status: true,
    $or: [{ sender: req.params.userId }, { recipient: req.params.userId }],
  }).exec((err, friends) => {
    if (err) return next(err);
    return res.json(friends);
  });
};

// List all pending friend requests
exports.friend_list_pending = function (req, res, next) {
  Friend.find({
    recipient: req.params.userId,
    status: false,
  }).exec((err, friends) => {
    if (err) return next(err);
    return res.json(friends);
  });
};

// Send a friend request
exports.friend_add = function (req, res, next) {
  // Check if the user already sent a request to that user
  Friend.findOne({ sender: req.user._id, recipient: req.params.userId }).exec(
    (err, friend) => {
      if (err) return next(err);
      if (friend) {
        return res.json({
          error: 'You have already sent this person a friend request.',
        });
      }
    },
  );

  // If not, send the request.
  const request = new Friend({
    sender: req.user._id,
    recipient: req.params.userId,
    status: false,
  });

  request.save((err) => {
    if (err) return next(err);
    res.redirect(303, `/users/${req.user._id}/friends`);
  });
};

// Accept a friend request
exports.friend_accept = [
  (req, res, next) => {
    // Check that the user is the one the request was sent to.
    Friend.findById(req.params.friendId).exec((err, friend) => {
      if (err) return next(err);
      if (req.user._id !== friend.recipient) {
        return res.status(403).json({ error: 'You do not have permission to perform this operation.' });
      }
      next();
    });
  },
  (req, res, next) => {
    Friend.findByIdAndUpdate(req.params.friendId, { status: true }, {}, (err) => {
      if (err) return next(err);
      res.redirect(303, `/users/${req.user._id}/friends`);
    });
  },
];

// Refuse a friend request or delete a friend
exports.friend_delete = [
  // Check the user permission
  (req, res, next) => {
    Friend.findById(req.params.friendId).exec((err, friend) => {
      if (err) return next(err);
      if (req.user._id !== friend.sender && req.user._id !== friend.recipient) {
        return res.status(403).json({ error: 'You do not have permission to perform this operation.' });
      }
      next();
    });
  },

  // Delete the friend document
  (req, res, next) => {
    Friend.findByIdAndRemove(req.params.friendId).exec((err) => {
      if (err) return next(err);
      res.redirect(303, `/users/${req.user._id}/friends`);
    });
  },
];
