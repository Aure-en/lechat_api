const mongoose = require('mongoose');

const { Schema } = mongoose;

const CategorySchema = new Schema({
  name: { type: String, required: true },
  timestamp: { type: Date, required: true },
  server: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
  channel: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
});

CategorySchema.virtual('url').get(function () {
  return `/servers/${this.server}/categories/${this._id}`;
});

module.exports = mongoose.model('Category', CategorySchema);
