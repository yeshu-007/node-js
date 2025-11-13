// Main Express Server - Entry point for Battery Health Monitoring Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const loggerMiddleware = require('./middleware/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const telemetryRoutes = require('./routes/telemetry.routes');
const historyRoutes = require('./routes/history.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:5500',
  credentials: true,
}));
app.use(loggerMiddleware);

// Routes
// Authentication endpoints
app.use('/api/auth', authRoutes);

// Telemetry endpoints (for data ingestion and real-time retrieval)
app.use('/api/telemetry', telemetryRoutes);

// Historical trends endpoints
app.use('/api/history', historyRoutes);

// Admin endpoints (protected with JWT and admin role)
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is running', 
    timestamp: new Date() 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://127.0.0.1:5500'}\n`);
});

module.exports = app;
