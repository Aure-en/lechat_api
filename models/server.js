const mongoose = require('mongoose');

const { Schema } = mongoose;

const ServerSchema = new Schema({
  name: { type: String, required: true },
  timestamp: { type: Date, required: true },
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  channel: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
  icon: {
    name: String,
    data: Buffer,
    contentType: String,
  },
  members: { type: Number, required: true, default: 0 },
});

ServerSchema.virtual('url').get(function () {
  return `/servers/${this._id}`;
});

module.exports = mongoose.model('Server', ServerSchema);
