const Message = require('../../models/message');

exports.init = (io) => {
  const changeStream = Message.watch();
  changeStream.on('change', (change) => {
    switch (change.operationType) {
      case 'insert':
      case 'update':

        // Get the whole message to populate the author
        // as change.fullDocument only sends the user _id.
        Message.findById(change.documentKey._id)
          .populate('author', 'username avatar')
          .exec((err, message) => {
            // Emit the message to the room
            const room = message.server || message.conversation;
            io.in(room.toString()).emit(`${change.operationType} message`, {
              operation: change.operationType,
              document: message,
            });
          });

        break;

      case 'delete':
        // watch() doesn't give the fullDocument on delete.
        // We cannot get the room id from the document
        // For now, emit to all rooms.
        // Improvement idea: add room/server number to document _id?
        io.emit(`${change.operationType} message`, {
          operation: change.operationType,
          document: { _id: change.documentKey._id },
        });
        break;
      default:
    }
  });
};
