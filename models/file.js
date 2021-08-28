const mongoose = require('mongoose');

const { Schema } = mongoose;

const FileSchema = new Schema({
  name: String,
  data: Buffer, // Full data
  contentType: String,
  size: Number,
  thumbnail: Buffer, // If the file is an image, a small thumbnail is created.
});

FileSchema.virtual('url').get(function () {
  return `/files/${this._id}`;
});

module.exports = mongoose.model('File', FileSchema);
