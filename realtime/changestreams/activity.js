const Activity = require('../../models/activity');

exports.init = (io) => {
  const changeStream = Activity.watch([], { fullDocument: 'updateLookup' });
  changeStream.on('change', (change) => {
    // On change, send the activity change to the user's room.
    // Sort the activity by timestamps to see which room the user visited last.
    io.in(change.fullDocument._id.toString()).emit(
      'activity update', change.fullDocument,
    );
  });
};
