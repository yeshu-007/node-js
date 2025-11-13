// Telemetry Model - time-series collection for voltage, temperature, cycle data
const mongoose = require('mongoose');

// Time-series collection for efficient telemetry data storage
const TelemetrySchema = new mongoose.Schema(
  {
    cellId: {
      type: Number,
      required: true,
      index: true,
    },
    voltage: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    cycleCount: {
      type: Number,
      default: 0,
    },
    ts: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { 
    timestamps: false,
  }
);

// Create time-series collection with custom options
const TelemetryModel = mongoose.model('Telemetry', TelemetrySchema);

module.exports = TelemetryModel;
