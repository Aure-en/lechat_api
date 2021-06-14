let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: '*',
      },
    });
    return io;
  },
  get: () => {
    if (!io) {
      throw new Error('Socket is not initialized');
    }
    return io;
  },
};
