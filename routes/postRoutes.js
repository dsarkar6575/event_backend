// routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer.js'); 

// @route   POST api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, upload.array('mediaUrls', 5),postController.createPost);

// @route   GET api/posts
// @desc    Get all posts (feed)
// @access  Public
router.get('/', postController.getAllPosts);

// @route   GET api/posts/:postId
// @desc    Get a single post by ID
// @access  Public
router.get('/:postId', postController.getPostById);

// @route   PUT api/posts/:postId
// @desc    Update a post
// @access  Private
router.put('/:postId', protect, postController.updatePost);

// @route   DELETE api/posts/:postId
// @desc    Delete a post
// @access  Private
router.delete('/:postId', protect, postController.deletePost);

// @route   PUT api/posts/:postId/interest
// @desc    Toggle user interest for a post/event
// @access  Private
router.put('/:postId/interest', protect, postController.togglePostInterest);

// @route   GET api/posts/interested
// @desc    Get posts the current user is interested in
// @access  Private
router.get('/my/interested', protect, postController.getInterestedPosts); // Specific route for current user's interested posts, avoid conflict with :postId


module.exports = router;