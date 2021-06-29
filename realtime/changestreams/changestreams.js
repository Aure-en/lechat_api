const message = require('./message');
const section = require('./section');
const server = require('./server');
const user = require('./user');
const friend = require('./friend');

exports.init = (io) => {
  message.init(io);
  section.init(io);
  server.init(io);
  user.init(io);
  friend.init(io);
};
