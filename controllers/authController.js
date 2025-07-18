const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Utility to generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { user: { id: userId } },
    process.env.JWT_SECRET,
    { expiresIn: '5h' }
  );
};

// @route   POST api/auth/register
// @desc    Register user with email & password
// @access  Public
exports.registerUser = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ msg: 'Please provide email, username, and password' });
  }

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      email,
      username,
      password: hashedPassword,
      bio: '',
      profileImageUrl: null,
    });

    await user.save();

    const token = generateToken(user.id);
    res.status(201).json({ token, user });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error during registration' });
  }
};

// @route   POST api/auth/login
// @desc    Log in user with email & password
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide email and password' });
  }

  try {
    // Explicitly selecting password in case it's excluded in schema
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'Invalid credentials' });
    }

    // password might be undefined if not stored correctly
    if (!user.password) {
      return res.status(500).json({ msg: 'User password not found in DB. Possible schema/config issue.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = generateToken(user.id);
    res.json({ token, user });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
};

// @route   GET api/auth
// @desc    Get authenticated user (using JWT middleware)
// @access  Private
exports.getAuthUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Fetch auth user error:', err);
    res.status(500).send('Server Error');
  }
};
