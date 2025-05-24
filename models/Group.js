const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Art', 'Music', 'Sports', 'Technology', 'Books', 'Gaming', 'Cooking', 'Fitness', 'Photography', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  imageURL: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  maxMembers: {
    type: Number,
    required: true,
    min: 2,
    max: 100
  },
  startDate: {
    type: Date,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

groupSchema.virtual('isFull').get(function() {
  return this.members.length >= this.maxMembers;
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group; 