const mongoose = require('mongoose');

const { Schema } = mongoose;

const ChannelSchema = new Schema({
  name: { type: String, required: true },
  timestamp: { type: Date, required: true },
  server: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  about: String,
});

ChannelSchema.virtual('url').get(function () {
  return `/channels/${this._id}`;
});

module.exports = mongoose.model('Channel', ChannelSchema);
