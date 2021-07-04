const Activity = require('../../models/activity');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = Activity.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      // On change, send the activity change to the user's room.

      // Sort the activity by timestamps to see which room the user visited last.
      const activity = change.fullDocument.activity.sort((a, b) => a.timestamp - b.timestamp);
      io.in(change.fullDocument._id.toString()).emit(
        'activity update',
        activity,
      );
    });
  },

  close: () => {
    changeStream.close();
  },
};
