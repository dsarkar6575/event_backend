const Chat = require('../models/Chat');
const Post = require('../models/Post'); // Now required
const User = require('../models/User'); // Now required for updating interestedEvents
const Message = require('../models/Message');
const mongoose = require('mongoose');

// @desc    Join (or create) group chat for a post when user marks Interested
// @route   POST /api/chat/join/:postId
// @access  Private
exports.joinPostGroupChat = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ msg: 'Invalid post ID' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post || !post.isEvent) {
      return res.status(404).json({ msg: 'Event post not found' });
    }

    let chat = await Chat.findOne({ postId });

    // Find the user to update their interestedEvents
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (chat) {
      // Add user to chat if not already a participant
      if (!chat.participants.includes(userId)) {
        chat.participants.push(userId);
        await chat.save();
      }
    } else {
      // Create new group chat
      chat = new Chat({
        postId,
        groupName: post.title,
        participants: [userId]
      });
      await chat.save();
    }

    // ⭐ IMPROVEMENT: Add the post to the user's interestedEvents array
    // This is a crucial step to correctly link the user to the event.
    if (!user.interestedEvents.includes(postId)) {
      user.interestedEvents.push(postId);
      await user.save();
    }

    // Populate response
    await chat.populate('participants', 'username profileImageUrl');
    res.status(200).json({ success: true, chat });

  } catch (err) {
    console.error('❌ Error in joinPostGroupChat:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get group chat by postId
// @route   GET /api/chat/post/:postId
// @access  Private
exports.getChatByPostId = async (req, res) => {
  const { postId } = req.params;

  try {
    // Note: It's good practice to ensure the user is a participant before returning the chat.
    const chat = await Chat.findOne({ postId })
      .populate('participants', 'username profileImageUrl')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username profileImageUrl' }
      });

    if (!chat) {
      return res.status(404).json({ msg: 'No group chat found for this post' });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error('❌ Error in getChatByPostId:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get messages in post's group chat
// @route   GET /api/chat/post/:postId/messages
// @access  Private
exports.getGroupMessages = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const chat = await Chat.findOne({ postId });
    if (!chat) {
      return res.status(404).json({ msg: 'No chat found for this event post' });
    }

    // ⭐ IMPROVEMENT: Add a check to ensure the user is a participant
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ msg: 'You are not a participant in this chat' });
    }

    const messages = await Message.find({ chat: chat._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profileImageUrl');

    res.status(200).json(messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Send message to group chat
// @route   POST /api/chat/post/:postId/messages
// @access  Private
exports.sendGroupMessage = async (req, res) => {
  const { content, type = 'text' } = req.body;
  const { postId } = req.params;
  const userId = req.user.id;

  if (!content?.trim() && type === 'text') {
    return res.status(400).json({ msg: 'Message content required' });
  }

  try {
    const chat = await Chat.findOne({ postId });
    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found for this post' });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ msg: 'You are not a participant in this chat' });
    }

    const newMessage = new Message({
      chat: chat._id,
      sender: userId,
      content,
      type,
      readBy: [userId]
    });

    const savedMessage = await newMessage.save();

    // Update chat with last message
    chat.lastMessage = savedMessage._id;
    await chat.save();

    await savedMessage.populate('sender', 'username profileImageUrl');

    // Emit via Socket.IO if needed here
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('❌ Error sending group message:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
