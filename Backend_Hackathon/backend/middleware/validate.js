// Request Validation Middleware - validates incoming request data
const { validationResult } = require('express-validator');

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  
  next();
};

module.exports = validateMiddleware;
