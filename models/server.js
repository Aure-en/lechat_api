const mongoose = require('mongoose');

const { Schema } = mongoose;

const ServerSchema = new Schema({
  name: { type: String, required: true },
  timestamp: { type: Date, required: true },
  admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  icon: {
    name: String,
    data: Buffer,
    contentType: String,
  },
  members: { type: Number, required: true, default: 1 },
  about: String,
});

ServerSchema.virtual('url').get(function () {
  return `/servers/${this._id}`;
});

module.exports = mongoose.model('Server', ServerSchema);
