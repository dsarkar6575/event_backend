const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/chat
// @desc    Get all chats for the current user (for the Chat List Screen)
router.get('/', protect, chatController.getUserChats);

// @route   POST /api/chat/join/:postId
// @desc    Join or create a group chat for a post
router.post('/join/:postId', protect, chatController.joinPostGroupChat);

// @route   GET /api/chat/post/:postId
// @desc    Get a specific chat's details by the original post's ID
router.get('/post/:postId', protect, chatController.getChatByPostId);

// @route   GET /api/chat/:chatId/messages
// @desc    Get all messages for a specific chat (for the Chat Screen)
// ✅ CORRECTED: This route now uses :chatId to match the frontend and solve the 404 error.
router.get('/:chatId/messages', protect, chatController.getGroupMessages);

// 🚨 DEPRECATED: The POST route for sending messages has been removed.
// This functionality is now handled exclusively by your real-time Socket.IO setup in server.js.

module.exports = router;