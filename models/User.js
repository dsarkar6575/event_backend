const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: function() { return !this.googleId; } ,
        minlength: 6
    },

    profileImageUrl: {
        type: String,
        default: null
    },

    bio: {
        type: String,
        default: '',
        maxlength: 200,
        trim: true
    },

    interestedEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
    }],

    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);
