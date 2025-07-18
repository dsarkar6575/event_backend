// models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ],
    isGroupChat: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        trim: true,
        default: null
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    }
}, {
    timestamps: true // Replaces manual createdAt and updatedAt
});

// ⚠️ Remove this index unless you're absolutely sure you want to restrict duplicate 1-on-1 chats
// Mongoose doesn't support unique index on array correctly unless handled carefully
// Better: enforce uniqueness in service/controller logic if needed

// ChatSchema.index(
//     { participants: 1 },
//     {
//         unique: true,
//         partialFilterExpression: {
//             isGroupChat: false,
//             'participants.1': { $exists: true }
//         }
//     }
// );

module.exports = mongoose.model('Chat', ChatSchema);
