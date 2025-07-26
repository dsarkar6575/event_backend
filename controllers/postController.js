const Post = require('../models/Post');
const User = require('../models/User'); // Assuming you have a User model
const cloudinary = require('../utils/cloudinary');
const fs = require('fs'); // Not used in provided code, can be removed if not needed elsewhere
const path = require('path'); // Not used in provided code, can be removed if not needed elsewhere

// ------------------------
// CREATE POST
// POST /api/posts
// Private
// ------------------------
exports.createPost = async (req, res) => {
  try {
    const {
      title,
      description,
      isEvent,
      eventDateTime,
      eventEndDateTime,
      location,
    } = req.body;

    // Basic validation
    if (!title || !description) {
      return res.status(400).json({ msg: 'Title and description are required.' });
    }

    // Handle boolean correctly (when isEvent is string from form-data)
    const isEventBool = isEvent === true || isEvent === 'true';

    // Event-specific validation
    if (isEventBool) {
      if (!eventDateTime || !eventEndDateTime) {
        return res.status(400).json({
          msg: 'Event date and time (start and end) are required for events.',
        });
      }

      const startDate = new Date(eventDateTime);
      const endDate = new Date(eventEndDateTime);

      if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ msg: 'Invalid event date/time format.' });
      }

      if (startDate >= endDate) {
        return res.status(400).json({ msg: 'Event end time must be after start time.' });
      }
    }

    // Handle media upload
    let imageUrls = [];

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64, {
          folder: 'event_social_posts',
        });
        return result.secure_url;
      });

      imageUrls = await Promise.all(uploadPromises);
    }

    // Create post
    const newPost = new Post({
      author: req.user.id,
      title,
      description,
      mediaUrls: imageUrls,
      isEvent: isEventBool,
      eventDateTime: isEventBool ? new Date(eventDateTime) : null,
      eventEndDateTime: isEventBool ? new Date(eventEndDateTime) : null,
      location: isEventBool ? location : null,
    });

    const post = await newPost.save();
    await post.populate('author', 'username profileImageUrl');

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
    // Added eventEndDateTime to destructuring
    const { title, description, isEvent, eventDateTime, eventEndDateTime, location, clearExistingMedia } = req.body;

    try {
        let post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Unauthorized: You are not the author.' });
        }

        // Handle clearing existing media if requested
        if (clearExistingMedia === 'true') {
            post.mediaUrls = [];
        }

        // Handle new file uploads if new files are provided
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const imageUploadPromises = req.files.map(async (file) => {
                const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                const result = await cloudinary.uploader.upload(base64, {
                    folder: 'event_social_posts',
                });
                return result.secure_url;
            });

            post.mediaUrls = await Promise.all(imageUploadPromises);
        }

        // Update other fields
        if (title !== undefined) post.title = title;
        if (description !== undefined) post.description = description;

        // Update event specific fields only if isEvent is true
        if (isEvent !== undefined) {
            post.isEvent = isEvent === 'true' || isEvent === true;
            if (!post.isEvent) {
                // If switching from event to non-event, clear event-specific fields
                post.eventDateTime = null;
                post.eventEndDateTime = null;
                post.location = null;
            }
        }

        if (post.isEvent) { // Only update if it's an event
            if (eventDateTime !== undefined) post.eventDateTime = eventDateTime;
            if (eventEndDateTime !== undefined) post.eventEndDateTime = eventEndDateTime; // Update eventEndDateTime
            if (location !== undefined) post.location = location;

            // Re-validate event dates if they were updated
            if (post.eventDateTime && post.eventEndDateTime && new Date(post.eventDateTime) >= new Date(post.eventEndDateTime)) {
                return res.status(400).json({ msg: 'Event end time must be after start time.' });
            }
        }


        await post.save();
        await post.populate('author', 'username profileImageUrl');

        res.status(200).json({ post: post.toObject({ getters: true }) });
    } catch (err) {
        console.error('❌ Error updating post:', err.message);
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

        // Only allow interest for event posts
        if (!post.isEvent) {
            return res.status(400).json({ msg: 'This action is only for event posts.' });
        }

        const userId = req.user.id;
        const now = new Date();

        // Check if event has started (not if it's over, but if it has begun)
        const isEventStarted = post.eventDateTime && now >= post.eventDateTime;

        if (isEventStarted) {
            // If the event has started, the "Interested" button becomes "Attended"
            // We'll redirect this to a separate `markAttendance` function or handle the logic here
            // For now, based on your requirement: "The "Interested" button changes to "Attended" only for users who previously marked themselves as interested."
            // This implies the action itself changes, but the *route* for interest isn't for attendance.
            // A dedicated route for attendance is cleaner. So, if event started, this route is effectively disabled for interest.
            return res.status(400).json({ msg: 'The event has already started. You can now mark attendance.' });
        }

        const isInterested = post.interestedUsers.includes(userId);

        if (isInterested) {
            // Remove interest
            post.interestedUsers = post.interestedUsers.filter(id => id.toString() !== userId);
            post.interestedCount = Math.max(post.interestedCount - 1, 0);
        } else {
            // Add interest
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
// GET /api/posts/my/interested
// Private
// ------------------------
exports.getInterestedPosts = async (req, res) => {
    try {
        // Only fetch events, as interest is only for events
        const posts = await Post.find({
            interestedUsers: req.user.id,
            isEvent: true
        })
            .sort({ eventDateTime: 1, createdAt: -1 })
            .populate('author', 'username profileImageUrl');

        res.status(200).json(posts.map(p => p.toObject({ getters: true })));
    } catch (err) {
        console.error('❌ Error fetching interested posts:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// ------------------------
// MARK ATTENDANCE
// PUT /api/posts/:postId/attend
// Private
// ------------------------
exports.markAttendance = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        // Must be an event
        if (!post.isEvent) {
            return res.status(400).json({ msg: 'This is not an event post.' });
        }

        const userId = req.user.id;
        const now = new Date();

        // Check if the event has started and not yet ended (or just ended)
        if (!post.eventDateTime || now < post.eventDateTime) {
            return res.status(400).json({ msg: 'Cannot mark attendance before the event has started.' });
        }

        // The key requirement: "Restrict attendance confirmation only to users who previously marked interest."
        const wasInterested = post.interestedUsers.includes(userId);
        if (!wasInterested) {
            return res.status(403).json({ msg: 'You must have marked interest to confirm attendance for this event.' });
        }

        const hasAttended = post.attendedUsers.includes(userId);

        if (hasAttended) {
            // If already attended, allow "un-attend"
            post.attendedUsers = post.attendedUsers.filter(id => id.toString() !== userId);
            post.attendedCount = Math.max(post.attendedCount - 1, 0);
        } else {
            // Mark attendance
            post.attendedUsers.push(userId);
            post.attendedCount += 1;
        }

        await post.save();
        await post.populate('author', 'username profileImageUrl');

        res.status(200).json({
            msg: hasAttended ? 'Attendance removed' : 'Attendance marked successfully',
            attended: !hasAttended,
            post: post.toObject({ getters: true })
        });
    } catch (err) {
        console.error('❌ Error marking attendance:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};


// ------------------------
// GET ATTENDED POSTS
// GET /api/posts/my/attended
// Private
// ------------------------
exports.getAttendedPosts = async (req, res) => {
    try {
        // Only fetch events where the user has attended and the event has ended
        const posts = await Post.find({
            attendedUsers: req.user.id,
            isEvent: true,
            eventEndDateTime: { $lt: new Date() } // Ensure the event has actually ended
        })
            .sort({ eventDateTime: -1 })
            .populate('author', 'username profileImageUrl');

        res.status(200).json(posts.map(p => p.toObject({ getters: true })));
    } catch (err) {
        console.error('❌ Error fetching attended posts:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};