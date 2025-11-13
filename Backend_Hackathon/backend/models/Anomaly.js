// Anomaly Model - stores detected anomalies from telemetry data
const mongoose = require('mongoose');

const AnomalySchema = new mongoose.Schema(
  {
    cellId: {
      type: Number,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    type: {
      type: String,
      enum: ['temperature', 'voltage', 'cycle_count'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    detectedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Anomaly', AnomalySchema);
