// Authentication Controller - handles login and registration
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// Register new user
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return sendError(res, null, 'Username, email, and password are required', 400);
    }

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return sendError(res, null, 'User already exists', 400);
    }

    // Create new user
    user = new User({
      username,
      email,
      password,
      role: role || 'user',
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key',
      { expiresIn: '7d' }
    );

    sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    sendError(res, error, 'Registration failed');
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input - accept either username or email
    if ((!username && !email) || !password) {
      return sendError(res, null, 'Username/Email and password are required', 400);
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) {
      return sendError(res, null, 'Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return sendError(res, null, 'Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key',
      { expiresIn: '7d' }
    );

    sendSuccess(
      res,
      {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      'Login successful'
    );
  } catch (error) {
    sendError(res, error, 'Login failed');
  }
};

module.exports = { registerUser, loginUser };
