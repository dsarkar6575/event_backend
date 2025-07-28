// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer.js'); 

// @route   GET api/users/:userId
// @desc    Get user profile by ID
// @access  Public
router.get('/:userId', userController.getUserProfile);

// @route   PUT api/users/:userId
// @desc    Update user profile
// @access  Private
router.put('/:userId', protect, upload.single('profileImageUrl'), userController.updateUserProfile);

// @route   GET api/users/:userId/posts
// @desc    Get all posts by a specific user
// @access  Public
router.get('/:userId/posts', userController.getUserPosts);

// @route   POST api/users/:userId/follow
// @desc    Follow a user
// @access  Private
router.post('/:userId/follow', protect, userController.followUser);

// @route   POST api/users/:userId/unfollow
// @desc    Unfollow a user
// @access  Private
router.post('/:userId/unfollow', protect, userController.unfollowUser);



module.exports = router;