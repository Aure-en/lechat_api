const Category = require('../../models/category');
const Channel = require('../../models/channel');

const realtime = (io, change, section) => {
// section is either 'category' or 'channel'
  switch (change.operationType) {
    case 'insert':
    case 'update':
      if (!change.fullDocument) return;
      const category = { ...change.fullDocument };

      // Emit the change to the room
      io.in(change.fullDocument.server.toString()).emit(`${change.operationType} ${section}`, {
        operation: change.operationType,
        document: category,
        section,
      });
      break;

    case 'delete':
      // watch() doesn't give the fullDocument on delete.
      // We cannot get the room id from the document
      // For now, emit to all rooms.
      // Improvement idea: add room/server number to document _id?
      io.emit(`${change.operationType} ${section}`, {
        operation: change.operationType,
        document: { _id: change.documentKey._id },
        section,
      });
      break;
    default:
  }
};

exports.init = (io) => {
  const categoryStream = Category.watch([], { fullDocument: 'updateLookup' });
  categoryStream.on('change', (change) => {
    realtime(io, change, 'category');
  });
  const channelStream = Channel.watch([], { fullDocument: 'updateLookup' });
  channelStream.on('change', (change) => {
    realtime(io, change, 'channel');
  });
};
