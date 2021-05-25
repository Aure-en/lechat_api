const mongoose = require('mongoose');

const { Schema } = mongoose;

const ChannelSchema = new Schema(
  {
    name: { type: String, required: true },
    timestamp: { type: Date, required: true },
    server: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
  },
);

ChannelSchema.virtual('url').get(function () {
  return `/servers/${this.server}/channels/${this._id}`;
});

module.exports = mongoose.model('Channel', ChannelSchema);
