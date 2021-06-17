const Server = require('../../models/server');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = Server.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      io.in(change.fullDocument._id).emit(`server ${change.operationType}`, {
        operation: change.operationType,
        document,
      });
    });
  },
  close: () => { changeStream.close(); },
};
