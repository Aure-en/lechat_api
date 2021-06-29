const Server = require('../../models/server');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = Server.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      console.log('CHANGE', change);
      console.log(change.fullDocument.icon);
      if (change.operationType === 'delete') return;

      // I have no idea why the server icon won't display properly
      // on the front-end when I simply send the change.fullDocument.
      Server.findById(change.fullDocument._id).exec((err, res) => {
        io.in(change.fullDocument._id.toString()).emit(`${change.operationType} server`, {
          operation: change.operationType,
          document: res,
        });
      });
    });
  },
  close: () => { changeStream.close(); },
};
