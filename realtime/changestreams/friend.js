const async = require('async');
const Friend = require('../../models/friend');
const User = require('../../models/user');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = Friend.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      console.log('FRIEND CHANGE', change);

      switch (change.operationType) {
        case 'insert':
        case 'update':
          if (!change.fullDocument) return;
          const document = { ...change.fullDocument };
          // Get the two users linked by the friendship
          async.parallel(
            {
              recipient(callback) {
                User.findOne({ _id: document.recipient }).exec(callback);
              },

              sender(callback) {
                User.findOne({ _id: document.sender }).exec(callback);
              },
            },
            (err, results) => {
              document.recipient = results.recipient;
              document.sender = results.sender;

              Object.keys(results).forEach((user) => {
                io
                  .in(results[user]._id.toString())
                  .emit(`${change.operationType} friend`, {
                    operation: change.operationType,
                    document,
                  });
              });
            },
          );
          break;

        case 'delete':
          // watch() doesn't give the fullDocument on delete.
          // We cannot get the ex-friends.
          // For now, emit to all rooms.
          // Improvement idea: add friends numbers to document _id?
          io.emit(`${change.operationType} friend`, {
            operation: change.operationType,
            document: { _id: change.documentKey._id },
          });
          break;
        default:
      }
    });
  },

  close: () => {
    changeStream.close();
  },
};
