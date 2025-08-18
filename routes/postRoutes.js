const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer.js'); 

// @route   POST api/posts
// @desc    Create a new post
// @access  Private
router.post('/', protect, upload.array('mediaUrls', 5), postController.createPost);

// @route   GET api/posts
// @desc    Get all posts (public feed)
// @access  Public
router.get('/', protect, postController.getAllPosts);

// ================= SPECIFIC ROUTES FIRST =================

// @route   GET api/posts/feed
// @desc    Get personalized feed
// @access  Private
router.get('/feed', protect, postController.getFeedPosts);

// @route   GET api/posts/my/interested
// @desc    Get posts the current user is interested in
// @access  Private
router.get('/my/interested', protect, postController.getInterestedPosts);

// @route   GET api/posts/my/attended
// @desc    Get posts the current user has attended
// @access  Private
router.get('/my/attended', protect, postController.getAttendedPosts);

// ==========================================================

// @route   GET api/posts/:postId
// @desc    Get a single post by ID
// @access  Public
router.get('/:postId', protect, postController.getPostById);

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

// @route   POST api/posts/:postId/attend
// @desc    Mark attendance for an event
// @access  Private
router.post('/:postId/attend', protect, postController.markAttendance);

// @route   PUT api/posts/:postId/attendance
// @desc    Toggle attendance
// @access  Private
router.put('/:postId/attendance', protect, postController.togglePostAttendance);

// @route   POST api/posts/:postId/join-interest-group
// @desc    Join interest group for post
// @access  Private
router.post('/:postId/join-interest-group', protect, postController.joinInterestGroup);

module.exports = router;
