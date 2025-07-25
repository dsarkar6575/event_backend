const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    mediaUrls: [{
        type: String, 
        trim: true
    }],
    interestedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    attendedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    commentCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isEvent: {
        type: Boolean,
        default: false
    },
    eventDateTime: {
        type: Date,
        default: null
    },
    eventEndDateTime: {
        type: Date,
        default: null
    },
    location: {
        type: String,
        default: null,
        trim: true
    },
    interestedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    attendedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Add index for better query performance
PostSchema.index({ isEvent: 1, eventEndDateTime: 1 });

module.exports = mongoose.model('Post', PostSchema);