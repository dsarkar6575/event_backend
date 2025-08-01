require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken'); // ✅ Moved to the top
const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Models
const Chat = require('./models/Chat');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Inject io instance into all requests
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST"]
  }
});
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO JWT Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: No token provided.'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.user; // Attach user to socket
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token.'));
  }
});

// Socket.IO Events
io.on('connection', async (socket) => {
  console.log(`✅ Socket connected: ${socket.user.id}`);

  // Join personal room
  socket.join(socket.user.id);

  // Join all group chat rooms the user is part of
  try {
    const userChats = await Chat.find({ participants: socket.user.id }).select('_id');
    userChats.forEach(chat => {
      socket.join(chat._id.toString());
    });
  } catch (err) {
    console.error('❌ Failed to join chat rooms:', err.message);
  }

  // Listen to real-time message sending
  socket.on('sendMessage', async (data) => {
    try {
      console.log('📩 Incoming socket message:', data);

      io.to(data.chatRoomId).emit('receiveMessage', {
        ...data,
        sender: socket.user.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Socket message error:', error);
      socket.emit('sendMessageError', { message: 'Failed to send message.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`⚠️ Socket disconnected: ${socket.user.id}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', commentRoutes); // For comments

// Basic error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).send('Something broke!');
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
