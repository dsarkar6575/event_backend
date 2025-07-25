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
    eventDateTime: { // This will be the start time of the event
        type: Date,
        default: null
    },
    eventEndDateTime: { // New: End time of the event
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
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals are included when converting to JSON
    toObject: { virtuals: true } // Ensure virtuals are included when converting to object
});

// Virtual for isExpired
PostSchema.virtual('isExpired').get(function() {
    // An event is expired if it's an event and its eventEndDateTime has passed
    return this.isEvent && this.eventEndDateTime && new Date() >= this.eventEndDateTime;
});

// Add index for better query performance
PostSchema.index({ isEvent: 1, eventEndDateTime: 1 });

module.exports = mongoose.model('Post', PostSchema);