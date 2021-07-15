const Server = require('../../models/server');

let changeStream;

module.exports = {
  init: (io) => {
    changeStream = Server.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', (change) => {
      console.log('SERVER CHANGE', change);
      if (change.operationType === 'delete' || change.operationType === 'insert') return;

      // On settings update (name, icon, description)...
      const settings = ['name', 'icon', 'description'];
      if (
        settings.some((field) => Object.keys(change.updateDescription.updatedFields).includes(field))
      ) {
        // I have no idea why the server icon won't display properly
        // on the front-end when I simply send the change.fullDocument.
        Server.findById(change.fullDocument._id).exec((err, res) => {
          io.in(change.fullDocument._id.toString()).emit(
            `${change.operationType} server`,
            {
              operation: change.operationType,
              document: res,
            },
          );
        });
      }

      // On members update
      if (change.operationType === 'update' && change.updateDescription.updatedFields.members) {
        io.in(change.fullDocument._id.toString()).emit('member update');
      }
    });
  },
  close: () => {
    changeStream.close();
  },
};
