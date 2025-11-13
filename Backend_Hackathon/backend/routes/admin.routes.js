// Admin Routes
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const validateMiddleware = require('../middleware/validate');
const {
  getAllCells,
  addCell,
  deleteCell,
  getAllAnomalies,
  getAnomalyById,
  updateAnomalyStatus,
} = require('../controllers/admin.controller');

// GET /api/admin/cells - Get all cells (admin only)
router.get('/cells', authMiddleware, adminOnly, getAllCells);

// POST /api/admin/cells - Add new cell (admin only)
router.post(
  '/cells',
  authMiddleware,
  adminOnly,
  [
    body('cellId').isInt(),
    body('status').optional().isIn(['Healthy', 'Warning', 'Critical']),
    body('chargeCycles').optional().isInt(),
  ],
  validateMiddleware,
  addCell
);

// DELETE /api/admin/cells/:id - Delete cell (admin only)
router.delete(
  '/cells/:id',
  authMiddleware,
  adminOnly,
  [param('id').isMongoId()],
  validateMiddleware,
  deleteCell
);

// GET /api/admin/anomalies - Get all anomalies (admin only)
router.get('/anomalies', authMiddleware, adminOnly, getAllAnomalies);

// GET /api/admin/anomalies/:id - Get anomaly by ID (admin only)
router.get(
  '/anomalies/:id',
  authMiddleware,
  adminOnly,
  [param('id').isMongoId()],
  validateMiddleware,
  getAnomalyById
);

// PATCH /api/admin/anomalies/:id - Update anomaly status (admin only)
router.patch(
  '/anomalies/:id',
  authMiddleware,
  adminOnly,
  [param('id').isMongoId()],
  validateMiddleware,
  updateAnomalyStatus
);

module.exports = router;
