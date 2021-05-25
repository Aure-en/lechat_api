const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, trim: true, required: true },
    password: { type: String, trim: true, required: true },
    email: {
      type: String, required: true, trim: true, lowercase: true,
    },
    avatar: {
      name: String,
      data: Buffer,
      contentType: String,
    },
    created: Date,
  },
);

module.exports = mongoose.model('User', UserSchema);
