exports.setQueries = (options) => {
  const queries = {};
  const {
    search, channel, author, before, after, file,
  } = options;

  if (search) {
    queries.text = { $regex: options.search, $options: 'i' };
  }

  if (author) {
    queries.author = options.author;
  }

  if (channel) {
    queries.channel = options.channel;
  }

  if (after) {
    queries.timestamp = { $gt: options.after };
  }

  if (before) {
    queries.timestamp = { $lt: options.before };
  }

  if (file) {
    queries.file = { $exists: true };
  }
  return queries;
};

exports.setPagination = (options) => {
  const { last_key } = options;
  if (last_key) return { _id: { $lt: last_key } };
};