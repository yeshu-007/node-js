// Historical Trends Routes
const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const validateMiddleware = require('../middleware/validate');
const {
  getCellHistoricalInfo,
  getAllHistoricalCells,
} = require('../controllers/history.controller');

// GET /api/history/cells/:cellId - Get historical info for specific cell
router.get(
  '/cells/:cellId',
  [param('cellId').isInt()],
  validateMiddleware,
  getCellHistoricalInfo
);

// GET /api/history/cells - Get historical info for all cells
router.get('/cells', getAllHistoricalCells);

module.exports = router;
