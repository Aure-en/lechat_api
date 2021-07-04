const mongoose = require('mongoose');

const { Schema } = mongoose;

const ActivitySchema = new Schema({
  servers: [
    {
      _id: { type: Schema.Types.ObjectId, ref: 'Server', required: true },
      channels: [
        {
          _id: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
          timestamp: Number,
        },
      ],
    },
  ],
  conversations: [
    {
      _id: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
      timestamp: Number,
    },
  ],
  _id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

ActivitySchema.virtual('url').get(function () {
  return `/activity/${this._id}`;
});

module.exports = mongoose.model('Activity', ActivitySchema);
