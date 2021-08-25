const async = require('async');
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

        /**
         * Get the author's informations (username and avatar)
         * If there are files, get them (somehow, the src does not work
         * if taken directly from change.fullDocument).
         * Place all those informations in document, and send it to the client.
         */
        async.parallel(
          {
            user(callback) {
              User.findById(document.author, 'username avatar').exec(callback);
            },

            files(callback) {
              if (document.files.length > 0) {
                // Fetch images
                Message.findById(document._id, 'files').exec(callback);
              } else {
                callback();
              }
            },
          },
          (err, results) => {
            document.author = {
              _id: change.fullDocument.author.toString(),
              username: results.user.username,
              avatar:
                Object.keys(results.user.avatar).length > 0
                && results.user.avatar,
            };

            document._id = document._id.toString();

            if (document.server && document.channel) {
              document.server = document.server.toString();
              document.channel = document.channel.toString();
            }

            if (document.conversation) {
              document.conversation = document.conversation.toString();
            }

            if (results.files) {
              document.files = document.files.map((file, index) => (file.contentType.split('/')[0] === 'image'
                ? results.files.files[index]
                : file));
            }

            // Emit the message to the room
            const room = document.server || document.conversation;
            io.in(room.toString()).emit(`${change.operationType} message`, {
              operation: change.operationType,
              document,
            });
          },
        );

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
