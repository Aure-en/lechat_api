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
    socket.user = { _id: user._id, username: user.username };

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
exports.deauthentication = (socket, io) => {
  socket.on('deauthentication', () => {
    socket.rooms.forEach((room) => socket.leave(room));
    io.emit('typing', {
      location: socket.room,
      user: socket.user.username,
      typing: false,
    });
  });
};

/**
 * When a user join a location, join the corresponding room.
 * @param {*} socket
 */
exports.join = (socket) => {
  /**
   * @params string room (server or conversation id)
   * The socket will join the corresponding room to listen to changes.
   */
  socket.on('join', (room) => {
    socket.join(room);
  });
};

/**
 * Saves the room the user is currently in to remove him
 * from the room's typing users list easily.
 * @param {*} socket
 */
exports.join_room = (socket) => {
  socket.on('join room', (room) => {
    socket.room = room;
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
    if (data.users.includes(socket.user._id)) {
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
  /**
   * data {object}
   * {
   *   location {string} - channel or conversation id
   *   user {string} - username
   *   typing {boolean} - false
   * }
   */
  socket.on('typing', (data) => {
    io.emit('typing', data);
  });
};

exports.disconnect = (socket, io) => {
  socket.on('disconnect', () => {
    if (socket.user) {
      io.emit('typing', {
        location: socket.room,
        user: socket.user.username,
        typing: false,
      });
    }
  });
};
