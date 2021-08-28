const User = require('../../models/user');

exports.init = (io) => {
  const changeStream = User.watch([], { fullDocument: 'updateLookup' });
  changeStream.on('change', (change) => {
    if (change.operationType !== 'update') return;

    User.findById(change.fullDocument._id).populate('avatar').exec((err, res) => {
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
