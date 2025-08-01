// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // For protected routes

// @route   POST api/auth/register
// @desc    Register a new user (via Firebase ID token)
// @access  Public
router.post('/register', authController.registerUser);

// @route   POST api/auth/login
// @desc    Login user (via Firebase ID token) and get your backend JWT
// @access  Public
router.post('/login', authController.loginUser);



// @route   GET api/auth
// @desc    Get authenticated user details (using your JWT)
// @access  Private
router.get('/', protect, authController.getAuthUser);

module.exports = router;