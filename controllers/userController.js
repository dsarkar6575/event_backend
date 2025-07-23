const User = require('../models/User');
const Post = require('../models/Post');
const mongoose = require('mongoose');
const cloudinary = require('../utils/cloudinary'); // Make sure this exists

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get user profile by ID
// @route   GET /api/users/:userId
// @access  Public
exports.getUserProfile = async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }

    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(200).json({ success: true, user: user.toObject({ getters: true }) });
    } catch (err) {
        console.error('❌ Error in getUserProfile:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update user profile (only current user can update their own)
// @route   PUT /api/users/:userId
// @access  Private
// Update user profile with single image
exports.updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const { username, bio } = req.body;
  const currentUserId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: 'Invalid user ID format' });
  }

  if (currentUserId !== userId) {
    return res.status(403).json({ msg: 'Unauthorized' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (username) user.username = username;
    if (bio) user.bio = bio;

    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(base64, {
        folder: 'event_social_profiles',
      });
      user.profileImageUrl = result.secure_url;
    }

    await user.save();

    const { password, ...userData } = user.toObject(); // Exclude sensitive info
    res.status(200).json({ success: true, user: userData });
  } catch (err) {
    console.error('❌ Error updating profile:', err.stack || err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};


// @desc    Get all posts by a specific user
// @route   GET /api/users/:userId/posts
// @access  Public
exports.getUserPosts = async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }

    try {
        const posts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .populate('author', 'username profileImageUrl');

        res.status(200).json({ success: true, posts: posts.map(p => p.toObject({ getters: true })) });
    } catch (err) {
        console.error('❌ Error in getUserPosts:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Follow a user
// @route   POST /api/users/:userId/follow
// @access  Private
exports.followUser = async (req, res) => {
    const userToFollowId = req.params.userId;
    const currentUserId = req.user.id;

    if (!isValidObjectId(userToFollowId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }

    if (userToFollowId === currentUserId) {
        return res.status(400).json({ msg: 'You cannot follow yourself.' });
    }

    try {
        const [userToFollow, currentUser] = await Promise.all([
            User.findById(userToFollowId),
            User.findById(currentUserId)
        ]);

        if (!userToFollow || !currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        if (currentUser.following.includes(userToFollowId)) {
            return res.status(400).json({ msg: 'Already following this user.' });
        }

        currentUser.following.push(userToFollowId);
        userToFollow.followers.push(currentUserId);

        await Promise.all([currentUser.save(), userToFollow.save()]);

        res.status(200).json({ msg: 'User followed successfully.' });
    } catch (err) {
        console.error('❌ Error in followUser:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Unfollow a user
// @route   POST /api/users/:userId/unfollow
// @access  Private
exports.unfollowUser = async (req, res) => {
    const userToUnfollowId = req.params.userId;
    const currentUserId = req.user.id;

    if (!isValidObjectId(userToUnfollowId)) {
        return res.status(400).json({ msg: 'Invalid User ID format' });
    }

    try {
        const [userToUnfollow, currentUser] = await Promise.all([
            User.findById(userToUnfollowId),
            User.findById(currentUserId)
        ]);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).json({ msg: 'User not found.' });
        }

        if (!currentUser.following.includes(userToUnfollowId)) {
            return res.status(400).json({ msg: 'You are not following this user.' });
        }

        currentUser.following = currentUser.following.filter(
            (id) => id.toString() !== userToUnfollowId
        );
        userToUnfollow.followers = userToUnfollow.followers.filter(
            (id) => id.toString() !== currentUserId
        );

        await Promise.all([currentUser.save(), userToUnfollow.save()]);

        res.status(200).json({ msg: 'User unfollowed successfully.' });
    } catch (err) {
        console.error('❌ Error in unfollowUser:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
