const Conversation = require('../models/conversation');

exports.authentification = (socket) => {
  socket.on('authentification', async (userData) => {
    const user = JSON.parse(userData);
    console.log(user);
    // Listen to user changes
    socket.join(user._id);
    socket.join("test");

    // Listen to changes in user' servers
    user.server.map((server) => { socket.join(server); });

    // Listen to changes in user' conversation
    await Conversation.find({ members: user._id }, '_id').exec(
      (err, conversations) => {
        conversations.map((conversation) => {
          socket.join(conversation._id.toString());
        });
      },
    );
    console.log(socket.rooms);
  });
};
