const mongoose = require('mongoose');

const { Schema } = mongoose;

const ServerSchema = new Schema(
  {
    name: { type: String, required: true },
    timestamp: { type: Date, required: true },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channels: [{ type: Schema.Types.ObjectId, ref: 'Channel', required: true }],
  },
);

module.exports = mongoose.model('Server', ServerSchema);
