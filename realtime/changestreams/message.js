const Message = require('../../models/message');
const User = require('../../models/user');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = Message.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      console.log('CHANGE', change);

      switch (change.operationType) {
        case 'insert':
        case 'update':
          if (!change.fullDocument) return;
          const document = { ...change.fullDocument };
          // Get the author username
          User.findById(document.author, 'username').exec((err, user) => {
            document.author = {
              _id: change.fullDocument.author,
              username: user.username,
            };

            // Emit the message to the room
            const room = document.server || document.conversation;
            io.in(room.toString()).emit(`${change.operationType} message`, {
              operation: change.operationType,
              document,
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
  },

  close: () => { changeStream.close(); },
};
