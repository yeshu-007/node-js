// Admin Routes
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const validateMiddleware = require('../middleware/validate');
const {
  getAllCells,
  addCell,
  updateCell,
  deleteCell,
  getAllAnomalies,
  getAnomalyById,
  updateAnomalyStatus,
} = require('../controllers/admin.controller');

// GET /api/admin/cells - Get all cells (admin only)
router.get('/cells', authMiddleware, adminOnly, getAllCells);

// POST /api/admin/create - Create new cell (admin only)
router.post(
  '/create',
  authMiddleware,
  adminOnly,
  [
    body('cellId').isInt().toInt(),
    body('status').optional().isIn(['Healthy', 'Warning', 'Critical']),
    body('chargeCycles').optional().isInt().toInt(),
    body('avgVoltage').optional().isFloat(),
    body('avgTemperature').optional().isFloat(),
  ],
  validateMiddleware,
  addCell
);

// POST /api/admin/cells - Create new cell (legacy endpoint - admin only)
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

// PUT /api/admin/update/:id - Update cell by ID (admin only)
router.put(
  '/update/:id',
  authMiddleware,
  adminOnly,
  [
    param('id').isMongoId(),
    body('cellId').optional().isInt(),
    body('status').optional().isIn(['Healthy', 'Warning', 'Critical']),
    body('chargeCycles').optional().isInt(),
    body('avgVoltage').optional().isFloat(),
    body('avgTemperature').optional().isFloat(),
  ],
  validateMiddleware,
  updateCell
);

// DELETE /api/admin/delete/:id - Delete cell by ID (admin only)
router.delete(
  '/delete/:id',
  authMiddleware,
  adminOnly,
  [param('id').isMongoId()],
  validateMiddleware,
  deleteCell
);

// DELETE /api/admin/cells/:id - Delete cell (legacy endpoint - admin only)
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
