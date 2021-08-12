const Message = require('../../models/message');
const User = require('../../models/user');

exports.init = (io) => {
  const changeStream = Message.watch([], { fullDocument: 'updateLookup' });
  changeStream.on('change', (change) => {
    switch (change.operationType) {
      case 'insert':
      case 'update':
        if (!change.fullDocument) return;
        const document = { ...change.fullDocument };
        // Get the author username
        User.findById(document.author, 'username avatar').exec((err, user) => {
          document.author = {
            _id: change.fullDocument.author.toString(),
            username: user.username,
            avatar: Object.keys(user.avatar).length > 0 && user.avatar,
          };

          document._id = document._id.toString();

          if (document.server && document.channel) {
            document.server = document.server.toString();
            document.channel = document.channel.toString();
          }

          if (document.conversation) {
            document.conversation = document.conversation.toString();
          }

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
};
