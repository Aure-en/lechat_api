const message = require('./message');
const section = require('./section');
const server = require('./server');
const user = require('./user');
const friend = require('./friend');
const activity = require('./activity');
const conversation = require('./conversation');

exports.init = (io) => {
  message.init(io);
  section.init(io);
  server.init(io);
  user.init(io);
  friend.init(io);
  activity.init(io);
  conversation.init(io);
};
