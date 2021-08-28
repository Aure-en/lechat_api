const Server = require('../../models/server');

exports.init = (io) => {
  const changeStream = Server.watch([], { fullDocument: 'updateLookup' });
  changeStream.on('change', (change) => {
    if (change.operationType === 'delete' || change.operationType === 'insert') return;

    // On settings update (name, icon, description)...
    const settings = ['name', 'icon', 'description'];
    if (
      settings.some((field) => Object.keys(change.updateDescription.updatedFields).includes(field))
    ) {
      // Fetch and send the server to populate the icon.
      Server.findById(change.fullDocument._id)
        .populate('icon')
        .exec((err, res) => {
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
    if (
      change.operationType === 'update'
      && change.updateDescription.updatedFields.members
    ) {
      io.in(change.fullDocument._id.toString()).emit('member update');
    }
  });
};
