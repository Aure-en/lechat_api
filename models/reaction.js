const mongoose = require('mongoose');

const { Schema } = mongoose;

const ReactionSchema = new Schema({
  name: {
    type: String, trim: true, required: true, match: /^:.+:$/,
  },
  image: {
    type: {
      name: String,
      data: Buffer,
      contentType: String,
    },
    required: true,
  },
  category: {
    type: String,
    enum: [
      'emoji',
      'letter',
      'shape',
      'social',
      'other',
      'user',
      'weather',
    ],
    default: 'other',
  },
});

module.exports = mongoose.model('Reaction', ReactionSchema);
