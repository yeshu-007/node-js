// Authentication Routes
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/auth.controller');
const validateMiddleware = require('../middleware/validate');

// POST /api/auth/register - Register new user
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validateMiddleware,
  registerUser
);

// POST /api/auth/login - Login user
router.post(
  '/login',
  [
    body('username').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').exists().withMessage('Password is required'),
  ],
  validateMiddleware,
  loginUser
);

module.exports = router;
