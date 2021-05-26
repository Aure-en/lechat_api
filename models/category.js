const mongoose = require('mongoose');

const { Schema } = mongoose;

const CategorySchema = new Schema({
  name: { type: String, required: true },
  server: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
  channel: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
  timestamp: { type: Date, required: true },
});

CategorySchema.virtual('url').get(function () {
  return `/categories/${this._id}`;
});

module.exports = mongoose.model('Category', CategorySchema);
