const User = require('../../models/user');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = User.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      console.log('CHANGE', change);
      if (change.operationType !== 'update') return;

      // Personal account changes are only sent to the user itself.
      io.in(change.fullDocument._id.toString()).emit('account update', {
        operation: change.operationType,
        document: change.fullDocument,
        fields: change.updateDescription.updatedFields,
      });

      // Username, avatar and servers changes are sent to everyone
      const profile = ['username', 'avatar', 'server'];

      // updatedFields includes either "username", "avatar" or "server"
      if (
        profile.some((field) => Object.keys(change.updateDescription.updatedFields).includes(field))
      ) {
        io.emit('user update', {
          operation: change.operationType,
          document: change.fullDocument,
          fields: change.updateDescription.updatedFields,
        });
      }
    });
  },

  close: () => {
    changeStream.close();
  },
};
