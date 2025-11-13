// Telemetry Controller - handles telemetry data ingestion and retrieval
const Telemetry = require('../models/Telemetry');
const Cell = require('../models/Cell');
const { sendSuccess, sendError } = require('../utils/response');
const { detectAnomalies } = require('../utils/anomalyDetection');

// Ingest telemetry data
const ingestTelemetry = async (req, res) => {
  try {
    const { cellId, voltage, temperature, cycleCount } = req.body;

    // Validate input
    if (!cellId || voltage === undefined || temperature === undefined) {
      return sendError(res, null, 'Missing required fields', 400);
    }

    // Create telemetry record
    const telemetry = new Telemetry({
      cellId,
      voltage,
      temperature,
      cycleCount: cycleCount || 0,
      ts: new Date(),
    });

    await telemetry.save();

    // Update cell's average values
    const cellData = await Cell.findOne({ cellId });
    if (cellData) {
      cellData.avgVoltage = voltage;
      cellData.avgTemperature = temperature;
      cellData.chargeCycles = cycleCount || cellData.chargeCycles;
      await cellData.save();
    }

    // Detect anomalies
    await detectAnomalies({ cellId, voltage, temperature, cycleCount });

    sendSuccess(res, telemetry, 'Telemetry data ingested successfully', 201);
  } catch (error) {
    sendError(res, error, 'Failed to ingest telemetry data');
  }
};

// Get real-time data (latest values per cell)
const getRealTimeData = async (req, res) => {
  try {
    // Get latest telemetry for each active cell
    const cells = await Cell.find({ isActive: true });
    const realtimeData = [];

    for (const cell of cells) {
      const latestTelemetry = await Telemetry.findOne({ cellId: cell.cellId })
        .sort({ ts: -1 })
        .limit(1);

      realtimeData.push({
        cellId: cell.cellId,
        voltage: latestTelemetry?.voltage || cell.avgVoltage,
        temperature: latestTelemetry?.temperature || cell.avgTemperature,
        cycleCount: latestTelemetry?.cycleCount || cell.chargeCycles,
        status: cell.status,
        timestamp: latestTelemetry?.ts || new Date(),
      });
    }

    sendSuccess(res, realtimeData, 'Real-time data retrieved successfully');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve real-time data');
  }
};

// Get voltage history for a specific cell
const getVoltageHistory = async (req, res) => {
  try {
    const { cellId } = req.params;
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch voltage data
    const voltageHistory = await Telemetry.find({
      cellId: parseInt(cellId),
      ts: { $gte: startDate, $lte: endDate },
    })
      .sort({ ts: 1 })
      .select('ts voltage cellId');

    sendSuccess(res, voltageHistory, 'Voltage history retrieved successfully');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve voltage history');
  }
};

// Get temperature history for a specific cell
const getTemperatureHistory = async (req, res) => {
  try {
    const { cellId } = req.params;
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch temperature data
    const temperatureHistory = await Telemetry.find({
      cellId: parseInt(cellId),
      ts: { $gte: startDate, $lte: endDate },
    })
      .sort({ ts: 1 })
      .select('ts temperature cellId');

    sendSuccess(res, temperatureHistory, 'Temperature history retrieved successfully');
  } catch (error) {
    sendError(res, error, 'Failed to retrieve temperature history');
  }
};

module.exports = {
  ingestTelemetry,
  getRealTimeData,
  getVoltageHistory,
  getTemperatureHistory,
};
