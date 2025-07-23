const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'username profileImageUrl')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

exports.createComment = async (req, res) => {
  try {
    console.log("✅ createComment HIT");

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized: User info missing from token' });
    }

    const comment = new Comment({
      content,
      post: req.params.postId,
      author: req.user.id,
    });

    await comment.save();
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentCount: 1 } });

    const populated = await comment.populate('author', 'username profileImageUrl');
    res.status(201).json(populated);
  } catch (error) {
    console.error('❌ Create comment error:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
};

