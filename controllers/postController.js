// controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');
const cloudinary = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

// ------------------------
// CREATE POST
// POST /api/posts
// Private
// ------------------------
exports.createPost = async (req, res) => {
  const { title, description, isEvent, eventDateTime, location } = req.body;

  if (!title || !description) {
    return res.status(400).json({ msg: 'Title and description are required.' });
  }

  try {
    let imageUrls = [];

    // Check if files exist and are an array
    if (req.files && Array.isArray(req.files)) {
      const imageUploadPromises = req.files.map(async (file) => {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64, {
          folder: 'event_social_posts',
        });
        return result.secure_url;
      });

      imageUrls = await Promise.all(imageUploadPromises);
    }

    const newPost = new Post({
      author: req.user.id,
      title,
      description,
      mediaUrls: imageUrls,
      isEvent: isEvent === 'true' || isEvent === true,
      eventDateTime: isEvent ? eventDateTime : null,
      location: isEvent ? location : null,
    });

    const post = await newPost.save();
    await post.populate('author', 'username profileImageUrl');

    // Fix: Wrap the post object in a 'post' key
    res.status(201).json({ post: post.toObject({ getters: true }) });

  } catch (err) {
    console.error('❌ Error creating post:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};


// ------------------------
// GET ALL POSTS
// GET /api/posts
// Public
// ------------------------
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('author', 'username profileImageUrl');

        res.status(200).json(posts.map(p => p.toObject({ getters: true })));
    } catch (err) {
        console.error('❌ Error fetching posts:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ------------------------
// GET SINGLE POST
// GET /api/posts/:postId
// Public
// ------------------------
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('author', 'username profileImageUrl');

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.status(200).json(post.toObject({ getters: true }));
    } catch (err) {
        console.error('❌ Error fetching post:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Post ID' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ------------------------
// UPDATE POST
// PUT /api/posts/:postId
// Private
// ------------------------
exports.updatePost = async (req, res) => {
    const { title, description, mediaUrls, isEvent, eventDateTime, location } = req.body;

    try {
        let post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Unauthorized: You are not the author.' });
        }

        if (title !== undefined) post.title = title;
        if (description !== undefined) post.description = description;
        if (mediaUrls !== undefined) post.mediaUrls = mediaUrls;
        if (isEvent !== undefined) post.isEvent = isEvent;
        if (eventDateTime !== undefined) post.eventDateTime = eventDateTime;
        if (location !== undefined) post.location = location;

        await post.save();
        await post.populate('author', 'username profileImageUrl');

        res.status(200).json(post.toObject({ getters: true }));
    } catch (err) {
        console.error('❌ Error updating post:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Post ID' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ------------------------
// DELETE POST
// DELETE /api/posts/:postId
// Private
// ------------------------
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Unauthorized: You are not the author.' });
        }

        await Post.deleteOne({ _id: req.params.postId });
        res.status(200).json({ msg: 'Post deleted successfully.' });
    } catch (err) {
        console.error('❌ Error deleting post:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Post ID' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ------------------------
// TOGGLE INTEREST
// PUT /api/posts/:postId/interest
// Private
// ------------------------
exports.togglePostInterest = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const userId = req.user.id;
        const isInterested = post.interestedUsers.includes(userId);

        if (isInterested) {
            post.interestedUsers = post.interestedUsers.filter(id => id.toString() !== userId);
            post.interestedCount = Math.max(post.interestedCount - 1, 0);
        } else {
            post.interestedUsers.push(userId);
            post.interestedCount += 1;
        }

        await post.save();
        await post.populate('author', 'username profileImageUrl');

        res.status(200).json({
            msg: isInterested ? 'Interest removed' : 'Interest added',
            interested: !isInterested,
            post: post.toObject({ getters: true })
        });
    } catch (err) {
        console.error('❌ Error toggling interest:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ------------------------
// GET INTERESTED POSTS
// GET /api/posts/interested
// Private
// ------------------------
exports.getInterestedPosts = async (req, res) => {
    try {
        const posts = await Post.find({ interestedUsers: req.user.id })
            .sort({ eventDateTime: 1, createdAt: -1 })
            .populate('author', 'username profileImageUrl');

        res.status(200).json(posts.map(p => p.toObject({ getters: true })));
    } catch (err) {
        console.error('❌ Error fetching interested posts:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
