// History Controller - handles historical trends and analytics
const Telemetry = require('../models/Telemetry');
const Cell = require('../models/Cell');
const { sendSuccess, sendError } = require('../utils/response');

// Get historical cell info (stats over time period)
const getCellHistoricalInfo = async (req, res) => {
  try {
    const { cellId } = req.params;
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get cell info
    const cell = await Cell.findOne({ cellId: parseInt(cellId) });
    if (!cell) {
      return sendError(res, null, 'Cell not found', 404);
    }

    // Get telemetry statistics
    const stats = await Telemetry.aggregate([
      {
        $match: {
          cellId: parseInt(cellId),
          ts: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          avgVoltage: { $avg: '$voltage' },
          maxVoltage: { $max: '$voltage' },
          minVoltage: { $min: '$voltage' },
          avgTemperature: { $avg: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          minTemperature: { $min: '$temperature' },
          dataPoints: { $sum: 1 },
        },
      },
    ]);

    const historicalInfo = {
      cellId: cell.cellId,
      status: cell.status,
      chargeCycles: cell.chargeCycles,
      statistics: stats[0] || {
        avgVoltage: 0,
        maxVoltage: 0,
        minVoltage: 0,
        avgTemperature: 0,
        maxTemperature: 0,
        minTemperature: 0,
        dataPoints: 0,
      },
      period: { startDate, endDate },
    };

    sendSuccess(res, historicalInfo, 'Historical cell info retrieved successfully');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve historical cell info');
  }
};

// Get all historical cells info
const getAllHistoricalCells = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all active cells with stats
    const cells = await Cell.find({ isActive: true });
    const cellsInfo = [];

    for (const cell of cells) {
      const stats = await Telemetry.aggregate([
        {
          $match: {
            cellId: cell.cellId,
            ts: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            avgVoltage: { $avg: '$voltage' },
            avgTemperature: { $avg: '$temperature' },
            dataPoints: { $sum: 1 },
          },
        },
      ]);

      cellsInfo.push({
        cellId: cell.cellId,
        status: cell.status,
        avgVoltage: stats[0]?.avgVoltage || cell.avgVoltage,
        avgTemperature: stats[0]?.avgTemperature || cell.avgTemperature,
        dataPoints: stats[0]?.dataPoints || 0,
      });
    }

    sendSuccess(res, cellsInfo, 'All historical cells info retrieved successfully');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve all historical cells info');
  }
};

module.exports = {
  getCellHistoricalInfo,
  getAllHistoricalCells,
};
