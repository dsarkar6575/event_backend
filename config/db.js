const mongoose = require('mongoose');
// const dotenv = require('dotenv'); // Removed: Not needed if loaded in server.js
// dotenv.config(); // Removed: Not needed if loaded in server.js

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;