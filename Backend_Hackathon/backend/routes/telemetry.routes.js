// Telemetry Routes
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const validateMiddleware = require('../middleware/validate');
const {
  ingestTelemetry,
  getRealTimeData,
  getVoltageHistory,
  getTemperatureHistory,
} = require('../controllers/telemetry.controller');

// POST /api/telemetry - Ingest telemetry data (requires auth)
router.post(
  '/',
  authMiddleware,
  [
    body('cellId').isInt(),
    body('voltage').isFloat(),
    body('temperature').isFloat(),
  ],
  validateMiddleware,
  ingestTelemetry
);

// GET /api/telemetry/realtime - Get real-time data (requires auth)
router.get('/realtime', authMiddleware, getRealTimeData);

// GET /api/telemetry/:cellId/voltage/history - Get voltage history
router.get(
  '/:cellId/voltage/history',
  authMiddleware,
  [param('cellId').isInt()],
  validateMiddleware,
  getVoltageHistory
);

// GET /api/telemetry/:cellId/temperature/history - Get temperature history
router.get(
  '/:cellId/temperature/history',
  authMiddleware,
  [param('cellId').isInt()],
  validateMiddleware,
  getTemperatureHistory
);

module.exports = router;
