 const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    unique: true // Ensures one group chat per event post
  },
  isGroupChat: {
    type: Boolean,
    default: true
  },
  groupName: {
    type: String,
    required: true,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Chat', ChatSchema);