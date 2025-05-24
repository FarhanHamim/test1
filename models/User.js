const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  photoURL: {
    type: String,
    default: 'https://i.ibb.co/N6KP3bLy/image.png'
  },
  uid: {
    type: String,
    required: true,
    unique: true
  },
  joinedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  createdGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User; 