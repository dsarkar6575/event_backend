const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer.js');

// @route   POST api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, upload.array('mediaUrls', 5), postController.createPost);

// @route   GET api/posts/my/interested
// @desc    Get posts the current user is interested in
// @access  Private
// IMPORTANT: Place more specific routes like this before general ones like /:postId
router.get('/my/interested', protect, postController.getInterestedPosts);

// @route   GET api/posts/my/attended
// @desc    Get all attended events by user
// @access  Private
// IMPORTANT: Place more specific routes like this before general ones like /:postId
router.get('/my/attended', protect, postController.getAttendedPosts);

// @route   GET api/posts/:postId
// @desc    Get a single post by ID
// @access  Public
router.get('/:postId', postController.getPostById);

// @route   GET api/posts
// @desc    Get all posts (feed)
// @access  Public
// This can stay here or be moved up, as it's a root path and won't conflict with /:postId
router.get('/', postController.getAllPosts);

// @route   PUT api/posts/:postId
// @desc    Update a post
// @access  Private
router.put('/:postId', protect, upload.array('mediaUrls', 5), postController.updatePost);

// @route   DELETE api/posts/:postId
// @desc    Delete a post
// @access  Private
router.delete('/:postId', protect, postController.deletePost);

// @route   PUT api/posts/:postId/interest
// @desc    Toggle user interest for a post/event
// @access  Private
router.put('/:postId/interest', protect, postController.togglePostInterest);

// @route   PUT api/posts/:postId/attend
// @desc    Mark attendance for an event
// @access  Private
router.put('/:postId/attend', protect, postController.markAttendance);


module.exports = router;