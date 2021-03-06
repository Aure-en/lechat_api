const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, trim: true, required: true },
  password: { type: String, trim: true, required: true },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  avatar: { type: Schema.Types.ObjectId, ref: 'File' },
  server: [{ type: Schema.Types.ObjectId, ref: 'Server' }],
  timestamp: Date,
  active: { type: Boolean, default: true },
});

UserSchema.virtual('url').get(function () {
  return `/users/${this._id}`;
});

module.exports = mongoose.model('User', UserSchema);
