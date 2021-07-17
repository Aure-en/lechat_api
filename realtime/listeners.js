const Conversation = require('../models/conversation');

/**
 * When a user is authenticated, join the rooms corresponding
 * to the servers / conversations they are following.
 * @param {*} socket
 */
exports.authentication = (socket) => {
  socket.on('authentication', async (userData) => {
    const user = JSON.parse(userData);

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

/** When a user deauthenticate:
 * - Leave the rooms he was in.
 * @param {*} socket
*/
exports.deauthentication = (socket) => {
  socket.on('deauthentication', () => {
    socket.rooms.forEach((room) => socket.leave(room));
  });
};

/**
 * When a user join a location, join the corresponding room.
 * @param {*} socket
 */
exports.join = (socket) => {
  /**
   * @params {object} data:
   *  - location {string} (server or conversation id)
   *  - users {array} (users who must join the location room)
   * The socket will join the corresponding room to listen to changes.
   */
  socket.on('join', (data) => {
    if (data.users.includes(socket.user)) {
      socket.join(data.location);
    }
  });
};

/**
 * When a user leaves a location, leaves the corresponding room.
 * @param {*} socket
 */
exports.leave = (socket) => {
  /**
   * @params {object} data:
   *  - location {string} (server or conversation id)
   *  - users {array} (users who must join the location room)
   * The socket will join the corresponding room to listen to changes.
   */
  socket.on('leave', (data) => {
    if (data.users.includes(socket.user)) {
      socket.leave(data.location);
    }
  });
};

/**
 * When a user starts / stops typing in a room, tells
 * the other clients.
 * @param {*} socket
 */

exports.typing = (socket, io) => {
  socket.on('typing', (data) => {
    io.emit('typing', data);
  });
};

exports.disconnect = (socket) => {
  socket.on('disconnect', () => console.log('TEST'));
};
