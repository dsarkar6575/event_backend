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
    }],
    isExpired: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Add pre-save hook to check if event is expired
PostSchema.pre('save', function(next) {
    if (this.isEvent && this.eventDateTime) {
        this.isExpired = this.eventDateTime < new Date();
    }
    next();
});

module.exports = mongoose.model('Post', PostSchema);