const Conversation = require('../models/conversation');

exports.authentification = (socket) => {
  socket.on('authentification', async (userData) => {
    console.log(userData);
    const user = JSON.parse(userData);
    console.log("AUTHENTIFICATION", user);

    // Save the user data
    socket.user = user._id;
    // Listen to user changes
    socket.join(user._id);

    // Listen to changes in user' servers
    user.server.map((server) => {
      socket.join(server);
    });

    // Listen to changes in user' conversation
    await Conversation.find({ members: user._id }, '_id').exec(
      (err, conversations) => {
        conversations.map((conversation) => {
          socket.join(conversation._id.toString());
        });
      },
    );
  });
};

exports.join = (socket) => {
  /**
   * @params {object} data:
   *  - location (server or conversation id)
   *  - users (users who must join the location room)
   * The socket will join the corresponding room to listen to changes.
   */
  socket.on('join', async (data) => {
    console.log("JOIN", socket.user, data);
    if (data.users.includes(socket.user)) {
      socket.join(data.location);
    }
  });
};
