const Message = require('../../models/message');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = Message.watch();
    changeStream.on('change', (change) => {
      if (!change.fullDocument) return;
      const room = change.fullDocument.server || change.fullDocument.conversation;
      io.in(room.toString()).emit(change.operationType, {
        operation: change.operationType,
        document: change.fullDocument,
      });
    });
  },
  close: () => { changeStream.close(); },
};
