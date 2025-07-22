// routes/commentRoutes.js or similar
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/posts/:postId/comments
router.post('/:postId/comments', protect, commentController.createComment);
router.get('/:postId/comments', commentController.getCommentsByPost);


module.exports = router;
