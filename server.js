// server.js
require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // For Socket.IO
const { Server } = require("socket.io"); // For Socket.IO
const jwt = require('jsonwebtoken'); // <<< MOVED: Import jsonwebtoken here for use in Socket.IO auth

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/commentRoutes.js'); // Assuming you have a comments router

// Note: verifyToken from authMiddleware is typically for HTTP requests.
// For Socket.IO, direct JWT verification or a dedicated Socket.IO auth strategy is used,
// as you've done with jwt.verify below.

const app = express();
const server = http.createServer(app); // Create HTTP server for Express and Socket.IO

// Connect Database
connectDB();

// Middleware
// Enable CORS for all origins (ADJUST FOR PRODUCTION: e.g., origin: "https://yourfrontend.com")
app.use(cors());
app.use(express.json()); // Body parser for JSON data

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: "*", // ADJUST FOR PRODUCTION: e.g., origin: "https://yourfrontend.com"
        methods: ["GET", "POST"]
    }
});

// Basic Socket.IO authentication (optional, but highly recommended)
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided.'));
    }
    try {
        // Use your existing JWT verification logic
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user; // Attach user info to socket (e.g., { id: 'userId', username: '...' })
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token.'));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (Socket ID: ${socket.id})`);

    // Join a room for their user ID to receive direct messages or notifications
    // This allows you to target specific users with messages/notifications
    socket.join(socket.user.id);

    // TODO: In a real app, when a user connects, you'd load their chat memberships
    // and have them join corresponding chat rooms so they receive messages.
    // Example: (Assuming you fetch user's chat rooms from DB)
    /*
    async function joinUserChatRooms() {
        try {
            const userChats = await Chat.find({ participants: socket.user.id }); // Or similar logic
            userChats.forEach(chat => socket.join(chat._id.toString()));
            console.log(`User ${socket.user.id} joined ${userChats.length} chat rooms.`);
        } catch (error) {
            console.error(`Error joining chat rooms for user ${socket.user.id}:`, error);
        }
    }
    joinUserChatRooms();
    */

    // Handle incoming chat messages
    socket.on('sendMessage', async (data) => {
        // data should contain { chatRoomId, content, type, recipientId (if private chat) }
        try {
            // Placeholder: Implement saving the message to your database here.
            // Example: const newMessage = await chatService.saveMessage(data, socket.user.id);
            console.log(`Message from ${socket.user.id} to ${data.chatRoomId}: ${data.content}`);

            // Emit the message to all clients in the specific chat room
            io.to(data.chatRoomId).emit('receiveMessage', {
                ...data,
                sender: {
                    id: socket.user.id,
                    username: socket.user.username // Assuming username is in socket.user
                    // Add other sender info like profile image if available in socket.user
                },
                timestamp: new Date().toISOString()
            });

            // Optional: If it's a private chat, you might also emit a notification
            // to the recipient's personal room (if they are online and joined their user ID room)
            // if (data.recipientId && socket.user.id !== data.recipientId) {
            //      io.to(data.recipientId).emit('newNotification', {
            //          type: 'new_message',
            //          message: `New message from ${socket.user.username} in chat ${data.chatRoomId}`,
            //          chatId: data.chatRoomId
            //      });
            // }

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('sendMessageError', { message: 'Failed to send message.' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.id} (Socket ID: ${socket.id})`);
    });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes); // Consider how chat routes and Socket.IO interact
app.use('/api/notifications', notificationRoutes);
// Assuming commentRoutes handle paths like /api/posts/:postId/comments
app.use('/api/posts', commentRoutes);


// Basic error handling middleware (add more robust error handling in production)
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(err.statusCode || 500).json({ // Use custom error status if available
        msg: err.message || 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err : {} // Send error details only in dev
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));