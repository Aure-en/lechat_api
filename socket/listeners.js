const Conversation = require('../models/conversation');

exports.authentification = (socket) => {
  socket.on('authentification', (userData) => {
    const user = JSON.parse(userData);
    console.log(user);
    // Listen to user changes
    socket.join(user._id);

    // Listen to changes in user' servers
    user.server.map((server) => { socket.join(server); });

    // Listen to changes in user' conversation
    Conversation.find({ members: user._id }, '_id').exec(
      (err, conversations) => {
        conversations.map((conversation) => { socket.join(conversation); });
      },
    );
  });
};