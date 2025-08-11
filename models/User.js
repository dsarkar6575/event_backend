const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
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
    }],

    otp: String,

    otpExpires: Date,
    
    isVerified: {
        type: Boolean,
        default: false
    }
}, 
{
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);
