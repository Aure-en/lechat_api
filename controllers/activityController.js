const async = require('async');
const Activity = require('../models/activity');

exports.activity_create = function (req, res, next) {
  const activity = new Activity({
    _id: req.body.userId,
    activity: [],
  });

  activity.save((err) => {
    if (err) return next(err);
    return res.redirect(303, activity.url);
  });
};

exports.activity_update = function (req, res, next) {
  /*
   * If the user has never visited this room
   * → Create an object with the room _id and timestamp and insert it in the activity array.
   * Else, if the user has already visited this room.
   * → Look for the object with the room _id and update it.
   */

  async.parallel([
    // Update the room's activity if it exists in the array.
    function (callback) {
      Activity.updateOne(
        { _id: req.params.userId, 'activity.room': req.params.roomId },
        {
          $set: {
            'activity.$': {
              room: req.params.roomId,
              timestamp: Date.now(),
            },
          },
        },
      ).exec(callback);
    },

    // Push the room's activity in the activity array if it doesn't exist yet.
    function (callback) {
      Activity.findOneAndUpdate(
        { _id: req.params.userId, 'activity.room': { $ne: req.params.roomId } },
        { $push: { activity: { room: req.params.roomId, timestamp: Date.now() } } },
      ).exec(callback);
    },
  ], (err) => {
    if (err) return next(err);
    return res.redirect(303, `/activity/${req.params.userId}`);
  });
};

exports.activity_user = function (req, res, next) {
  Activity.findOne({ _id: req.params.userId })
    .populate('room')
    .exec((err, activity) => {
      if (err) return next(err);
      if (!activity) return res.status(404).json({ error: 'User not found' });
      return res.json(activity);
    });
};
