const Chat = require('../models/Chat');
const Post = require('../models/Post');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');

// @desc    Join (or create) group chat for a post when user marks Interested
// @route   POST /api/chat/join/:postId
// @access  Private
// @desc    Join (or create) group chat for a post when user marks Interested
// @route   POST /api/chat/join/:postId
// @access  Private
// In chatController.js

exports.joinPostGroupChat = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        const post = await Post.findById(postId);

        // 1. Validation
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }
        // This logic is for events, but can be adapted for any post
        if (!post.isEvent) {
             return res.status(400).json({ msg: 'This post does not have a group chat.' });
        }
        
        let chat = await Chat.findOne({ postId });

        if (chat) {
            // 2. Add user to existing chat if not already a member
            if (!chat.participants.map(p => p.toString()).includes(userId)) {
                chat.participants.push(userId);
                await chat.save();
            }
        } else {
            // 3. Create new chat, automatically including the post author
            chat = await Chat.create({
                postId,
                groupName: post.title,
                participants: [post.author, userId], // Add post author and current user
                isGroupChat: true,
            });
        }
        
        // 4. ✨ Crucial: Tell the user's socket to join the room in real-time
        // This avoids needing to reconnect to get new group messages.
        const io = req.io;
        io.in(userId).socketsJoin(chat._id.toString());
        
        await chat.populate('participants', 'username profileImageUrl');

        res.status(200).json({ msg: 'Successfully joined chat', chat });

    } catch (err) {
        console.error('❌ Error in joinPostGroupChat:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get group chat by postId
// @route   GET /api/chat/post/:postId
// @access  Private
exports.getChatByPostId = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id; // Get the user ID from the authenticated request

  try {
    const chat = await Chat.findOne({ postId })
      .populate('participants', 'username profileImageUrl')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username profileImageUrl' }
      });

    if (!chat) {
      return res.status(404).json({ msg: 'No group chat found for this post' });
    }

    // ⭐ Security Check: Ensure the user is a participant of the chat
    if (!chat.participants.includes(userId)) {
        return res.status(403).json({ msg: 'You do not have access to this chat.' });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error('❌ Error in getChatByPostId:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get messages in post's group chat
// @route   GET /api/chat/post/:postId/messages
// @access  Private
exports.getGroupMessages = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const chat = await Chat.findOne({ postId });
    if (!chat) {
      return res.status(404).json({ msg: 'No chat found for this event post' });
    }

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

// @desc    Send message to group chat
// @route   POST /api/chat/post/:postId/messages
// @access  Private
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

    chat.lastMessage = savedMessage._id;
    await chat.save();

    await savedMessage.populate('sender', 'username profileImageUrl');

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('❌ Error sending group message:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// In controllers/chatController.js

// @desc    Get all chats for the logged-in user
// @route   GET /api/chat
// @access  Private
exports.getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'username profileImageUrl')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username profileImageUrl' },
      })
      .sort({ updatedAt: -1 }); // Sort by most recent activity

    res.status(200).json(chats);
  } catch (err) {
    console.error('❌ Error fetching user chats:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};