// Cell Model - represents battery cells in the system
const mongoose = require('mongoose');

const CellSchema = new mongoose.Schema(
  {
    cellId: {
      type: Number,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['Healthy', 'Warning', 'Critical'],
      default: 'Healthy',
    },
    chargeCycles: {
      type: Number,
      default: 0,
    },
    avgVoltage: {
      type: Number,
      default: 3.85,
    },
    avgTemperature: {
      type: Number,
      default: 28.4,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cell', CellSchema);
