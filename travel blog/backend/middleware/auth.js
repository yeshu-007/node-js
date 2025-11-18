const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const userId = req.header('x-user-id');
    const token = req.header('x-session-token');

    if (!userId || !token) {
      return res.status(401).json({ message: 'Missing auth headers' });
    }

    const user = await User.findById(userId).select('+sessionToken');
    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    if (user.sessionToken !== token) {
      return res.status(401).json({ message: 'Invalid session token' });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = requireAuth;
