const mongoose = require('mongoose');

const { Schema } = mongoose;

const EmoteSchema = new Schema({
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

EmoteSchema.virtual('url').get(function () {
  return `/emotes/${this._id}`;
});

module.exports = mongoose.model('Emote', EmoteSchema);
