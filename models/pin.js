const mongoose = require('mongoose');

const { Schema } = mongoose;

const PinSchema = new Schema({
  // Either a channel._id or a conversation._id
  room: { type: Schema.Types.Mixed, required: true },
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
});

module.exports = mongoose.model('Pin', PinSchema);
