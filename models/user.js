const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  // Define relationship of user to events they created, referencing Event object id's
  createdEvents: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event'
    }
  ]
});

module.exports = mongoose.model('User', userSchema);