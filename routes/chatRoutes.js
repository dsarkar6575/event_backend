// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/chat/start
// @desc    Start or get an existing private chat
// @access  Private
router.post('/start', protect, chatController.startPrivateChat);

// @route   POST api/chat/group
// @desc    Create a new group chat
// @access  Private
router.post('/group', protect, chatController.createGroupChat);

// @route   GET api/chat
// @desc    Get all chats for the current user
// @access  Private
router.get('/', protect, chatController.getUserChats);

// @route   GET api/chat/:chatId/messages
// @desc    Get messages for a specific chat room
// @access  Private
router.get('/:chatId/messages', protect, chatController.getChatMessages);

// @route   POST api/chat/:chatId/messages
// @desc    Send a message (RESTful fallback) - primarily Socket.IO
// @access  Private
router.post('/:chatId/messages', protect, chatController.sendMessage);

// @route   PUT api/chat/messages/:messageId/read
// @desc    Mark a message as read by the current user
// @access  Private
router.put('/messages/:messageId/read', protect, chatController.markMessageAsRead);


module.exports = router;