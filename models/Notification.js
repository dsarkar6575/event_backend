// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: { // Optional: e.g., "X liked your post"
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    type: {
        type: String,
        required: true,
        enum: ['post_like', 'new_comment', 'follow', 'new_message', 'event_reminder'] // Optional: restrict to known types
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    relatedEntityId: { // Post ID, Chat ID, etc.
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = mongoose.model('Notification', NotificationSchema);
