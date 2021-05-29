const mongoose = require('mongoose');

const { Schema } = mongoose;

const FriendSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: Boolean, default: false, required: true }, // false if pending, true if mutuals.
});

module.exports = mongoose.model('Friend', FriendSchema);
