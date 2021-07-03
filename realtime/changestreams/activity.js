const Activity = require('../../models/activity');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = Activity.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      // On change, send the activity change to the user's room.
      io.in(change.fullDocument._id.toString()).emit(
        'activity update',
        change.fullDocument,
      );
    });
  },

  close: () => {
    changeStream.close();
  },
};
