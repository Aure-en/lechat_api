const mongoose = require('mongoose');

const { Schema } = mongoose;

const ConversationSchema = new Schema({
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

ConversationSchema.virtual('url').get(function () {
  return `/conversations/${this._id}`;
});

module.exports = mongoose.model('Conversation', ConversationSchema);
