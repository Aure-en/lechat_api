const User = require('../../models/user');

let changeStream;

exports.init = (io) => {
  changeStream = User.watch([], { fullDocument: 'updateLookup' });
  changeStream.on('change', (change) => {
    if (change.operationType !== 'update') return;

    // I have no idea why the icon won't display properly
    // on the front-end when I simply send the change.fullDocument.
    // The binary data doesn't work on src (?)
    User.findById(change.fullDocument._id).exec((err, res) => {
      // Personal account changes are only sent to the user itself.
      io.in(change.fullDocument._id.toString()).emit('account update', {
        operation: change.operationType,
        document: res,
        fields: change.updateDescription.updatedFields,
      });

      // Username and avatar changes are sent to everyone
      const profile = ['username', 'avatar'];

      // updatedFields includes either "username", "avatar".
      if (
        profile.some((field) => Object.keys(change.updateDescription.updatedFields).includes(field))
      ) {
        io.emit('user update', {
          operation: change.operationType,
          document: {
            username: res.username,
            avatar: res.avatar,
            _id: res._id.toString(),
          },
          fields: change.updateDescription.updatedFields,
        });
      }
    });
  });
};
