const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  timestamp: { type: Number, required: true },
  server: { type: Schema.Types.ObjectId, ref: 'Server' },
  channel: { type: Schema.Types.ObjectId, ref: 'Channel' },
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  edited: { type: Boolean, default: false },
  reaction: [
    new Schema({
      emote: { type: Schema.Types.ObjectId, ref: 'Emote' },
      users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      _id: { type: String, required: true },
    }),
  ],
});

MessageSchema.virtual('url').get(function () {
  return `/messages/${this._id}`;
});

module.exports = mongoose.model('Message', MessageSchema);
