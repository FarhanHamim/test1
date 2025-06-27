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

// Remove any existing username index if it exists
userSchema.index({ username: 1 }, { unique: true, sparse: true, background: true });
userSchema.on('index', function(err) {
  if (err) {
    console.error('User Model Index Error:', err);
  }
});

const User = mongoose.model('User', userSchema);

// Drop the username index if it exists
User.collection.dropIndex('username_1')
  .then(() => console.log('Username index dropped successfully'))
  .catch(err => {
    if (err.code === 27) {
      console.log('Username index does not exist, no need to drop');
    } else {
      console.error('Error dropping username index:', err);
    }
  });

module.exports = User; 