const mongoose = require('mongoose');

const { Schema } = mongoose;

const ReactionSchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    match: /^:.+:$/,
    lowercase: true,
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
    enum: ['emoji', 'letter', 'shape', 'social', 'other', 'user', 'weather'],
    default: 'other',
    lowercase: true,
    trim: true,
  },
});

ReactionSchema.virtual('url').get(function () {
  return `/reactions/${this._id}`;
});

module.exports = mongoose.model('Reaction', ReactionSchema);
