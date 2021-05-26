const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  server: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
  channel: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  edited: { type: Boolean, default: false },
});

MessageSchema.virtual('url').get(function () {
  return `/messages/${this._id}`;
});

module.exports = mongoose.model('Message', MessageSchema);
