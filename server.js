// server.js
require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // For Socket.IO
const { Server } = require("socket.io"); // For Socket.IO
const passportConfig = require('./config/passport');


const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/commentRoutes.js'); // Assuming you have a comments controller
const { verifyToken } = require('./middleware/authMiddleware'); // Import for Socket.IO auth

const app = express();
const server = http.createServer(app); // Create HTTP server for Express and Socket.IO

// Connect Database
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Body parser for JSON data

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for specific origins in production
        methods: ["GET", "POST"]
    }
});

// Basic Socket.IO authentication (optional, but recommended)
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided.'));
    }
    try {
        // Use your existing JWT verification logic
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded.user; // Attach user info to socket
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token.'));
    }
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`); // Assuming user.id is available

    // Join a room for their user ID to receive direct messages or notifications
    socket.join(socket.user.id);

    // Join chat rooms the user is part of (you'd load this from your DB)
    // Example: (In a real app, this would query chat memberships)
    // user.chatRooms.forEach(roomId => socket.join(roomId));

    // Handle incoming chat messages
    socket.on('sendMessage', async (data) => {
        // data should contain { chatRoomId, content, type, recipientId (if private chat) }
        try {
            // Placeholder: Save message to DB, then emit
            // const newMessage = await chatController.saveMessage(data); // Implement this
            console.log('Message received:', data);

            // Emit to all users in the specific chat room
            io.to(data.chatRoomId).emit('receiveMessage', {
                ...data,
                sender: socket.user.id, // Ensure sender is correctly set from authenticated user
                timestamp: new Date().toISOString()
            });

            // If it's a private chat, you might also emit a notification
            // to the recipient's personal room (socket.join(recipientId) above)
            // if (data.recipientId) {
            //     io.to(data.recipientId).emit('newNotification', {
            //         type: 'new_message',
            //         message: `New message from ${socket.user.username} in ${data.chatRoomId}`
            //     });
            // }

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('sendMessageError', { message: 'Failed to send message.' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.id}`);
    });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes); // Consider how chat routes and Socket.IO interact
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', commentRoutes);
// Assuming you have a comments controller

// Initialize Passport
passportConfig(app); // Pass the app instance to the passport config


// Basic error handling middleware (add more robust error handling)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
const jwt = require('jsonwebtoken'); // Move this line to the top if you need it globally

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));