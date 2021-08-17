const Conversation = require('../../models/conversation');

exports.init = (io) => {
  const changeStream = Conversation.watch([], { fullDocument: 'updateLookup' });
  changeStream.on('change', (change) => {
    switch (change.operationType) {
      // When a new conversation is created, send a socket event
      // to its members.
      case 'insert':
        if (!change.fullDocument) return;
        const document = { ...change.fullDocument };
        const { members } = document;

        Conversation.findById(change.fullDocument._id, 'members')
          .populate('members', 'username avatar')
          .exec((err, conversation) => {
            members.forEach((member) => {
              io.in(member._id.toString()).emit('insert conversation', {
                operation: change.operationType,
                document: {
                  _id: document._id,
                  members: conversation.members,
                },
              });

              io.in(member._id.toString()).emit('join', document._id);
            });
          });
        break;

      default:
        break;
    }
  });
};
