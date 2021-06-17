const User = require('../../models/user');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = User.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      io.emit(`user ${change.operationType}`, {
        operation: change.operationType,
        document,
      });
    });
  },
};
