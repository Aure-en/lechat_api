const mongoose = require('mongoose');

const { Schema } = mongoose;

const ActivitySchema = new Schema({
  activity: [
    {
      // Room can be channel, server or conversation id.
      room: { type: Schema.Types.ObjectId, required: true },
      timestamp: { type: Number, required: true },
      _id: false,
    },
  ],
  _id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

ActivitySchema.virtual('url').get(function () {
  return `/activity/${this._id}`;
});

module.exports = mongoose.model('Activity', ActivitySchema);
