
const Cell = require('../models/Cell');
const Anomaly = require('../models/Anomaly');
const { sendSuccess, sendError } = require('../utils/response');

// Get all cells
const getAllCells = async (req, res) => {
  try {
    const cells = await Cell.find({ isActive: true }).sort({ cellId: 1 });
    sendSuccess(res, cells, 'All cells retrieved successfully');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve cells');
  }
};

// Add new cell
const addCell = async (req, res) => {
  try {
    const { cellId, status, chargeCycles } = req.body;

    // Validate required fields
    if (!cellId) {
      return sendError(res, null, 'Cell ID is required', 400);
    }

    // Check if cell already exists
    const existingCell = await Cell.findOne({ cellId });
    if (existingCell) {
      return sendError(res, null, 'Cell already exists', 400);
    }

    // Create new cell
    const cell = new Cell({
      cellId,
      status: status || 'Healthy',
      chargeCycles: chargeCycles || 0,
    });

    await cell.save();
    sendSuccess(res, cell, 'Cell added successfully', 201);
  } catch (error) {
    sendError(res, error, 'Failed to add cell');
  }
};

// Update cell
const updateCell = async (req, res) => {
  try {
    const { id } = req.params;
    const { cellId, status, chargeCycles, avgVoltage, avgTemperature } = req.body;

    // Validate required fields
    if (!cellId) {
      return sendError(res, null, 'Cell ID is required', 400);
    }

    // Validate status if provided
    if (status && !['Healthy', 'Warning', 'Critical'].includes(status)) {
      return sendError(res, null, 'Invalid status', 400);
    }

    // Check if cell with new cellId already exists (if cellId is being changed)
    const existingCell = await Cell.findOne({ cellId, _id: { $ne: id } });
    if (existingCell) {
      return sendError(res, null, 'Cell ID already exists', 400);
    }

    // Build update object
    const updateData = { cellId };
    if (status) updateData.status = status;
    if (chargeCycles !== undefined) updateData.chargeCycles = chargeCycles;
    if (avgVoltage !== undefined) updateData.avgVoltage = avgVoltage;
    if (avgTemperature !== undefined) updateData.avgTemperature = avgTemperature;

    const cell = await Cell.findByIdAndUpdate(id, updateData, { new: true });
    if (!cell) {
      return sendError(res, null, 'Cell not found', 404);
    }

    sendSuccess(res, cell, 'Cell updated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to update cell');
  }
};

// Delete cell
const deleteCell = async (req, res) => {
  try {
    const { id } = req.params;

    const cell = await Cell.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!cell) {
      return sendError(res, null, 'Cell not found', 404);
    }

    sendSuccess(res, cell, 'Cell deleted successfully');
  } catch (error) {
    sendError(res, error, 'Failed to delete cell');
  }
};

// Get all anomalies
const getAllAnomalies = async (req, res) => {
  try {
    const { severity, resolved, limit = 100, skip = 0 } = req.query;

    // Build query filter
    const filter = {};
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.isResolved = resolved === 'true';

    const anomalies = await Anomaly.find(filter)
      .sort({ detectedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Anomaly.countDocuments(filter);

    sendSuccess(
      res,
      { anomalies, total, limit: parseInt(limit), skip: parseInt(skip) },
      'All anomalies retrieved successfully'
    );
  } catch (error) {
    sendError(res, error, 'Failed to retrieve anomalies');
  }
};

// Get anomaly by ID
const getAnomalyById = async (req, res) => {
  try {
    const { id } = req.params;

    const anomaly = await Anomaly.findById(id);
    if (!anomaly) {
      return sendError(res, null, 'Anomaly not found', 404);
    }

    sendSuccess(res, anomaly, 'Anomaly retrieved successfully');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve anomaly');
  }
};

// Update anomaly status (mark as resolved)
const updateAnomalyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isResolved } = req.body;

    const anomaly = await Anomaly.findByIdAndUpdate(
      id,
      { isResolved },
      { new: true }
    );

    if (!anomaly) {
      return sendError(res, null, 'Anomaly not found', 404);
    }

    sendSuccess(res, anomaly, 'Anomaly status updated successfully');
  } catch (error) {
    sendError(res, error, 'Failed to update anomaly status');
  }
};

module.exports = {
  getAllCells,
  addCell,
  updateCell,
  deleteCell,
  getAllAnomalies,
  getAnomalyById,
  updateAnomalyStatus,
};
