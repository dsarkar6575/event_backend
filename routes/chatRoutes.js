const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, chatController.getUserChats);

// Create or join group chat
router.post('/join/:postId', protect, chatController.joinPostGroupChat);

// Get chat by postId
router.get('/post/:postId', protect, chatController.getChatByPostId);

// Get all messages in a group chat
router.get('/post/:postId/messages', protect, chatController.getGroupMessages);

// Send message to group chat
router.post('/post/:postId/messages', protect, chatController.sendGroupMessage);

module.exports = router;
