// Anomaly Detection Utility - detects anomalies based on telemetry data
const Anomaly = require('../models/Anomaly');

// Thresholds for anomaly detection
const THRESHOLDS = {
  TEMPERATURE_CRITICAL: 40,
  TEMPERATURE_HIGH: 35,
  VOLTAGE_HIGH: 4.2,
  VOLTAGE_LOW: 3.2,
};

/**
 * Check telemetry data for anomalies and create Anomaly records
 * @param {Object} telemetryData - { cellId, voltage, temperature, cycleCount }
 */
const detectAnomalies = async (telemetryData) => {
  const { cellId, voltage, temperature, cycleCount } = telemetryData;
  const anomalies = [];

  try {
    // Check temperature thresholds
    if (temperature > THRESHOLDS.TEMPERATURE_CRITICAL) {
      const anomaly = new Anomaly({
        cellId,
        severity: 'critical',
        type: 'temperature',
        description: `Temperature critically high: ${temperature}°C`,
        value: temperature,
        threshold: THRESHOLDS.TEMPERATURE_CRITICAL,
      });
      await anomaly.save();
      anomalies.push(anomaly);
    } else if (temperature > THRESHOLDS.TEMPERATURE_HIGH) {
      const anomaly = new Anomaly({
        cellId,
        severity: 'high',
        type: 'temperature',
        description: `Temperature high: ${temperature}°C`,
        value: temperature,
        threshold: THRESHOLDS.TEMPERATURE_HIGH,
      });
      await anomaly.save();
      anomalies.push(anomaly);
    }

    // Check voltage thresholds
    if (voltage > THRESHOLDS.VOLTAGE_HIGH) {
      const anomaly = new Anomaly({
        cellId,
        severity: 'high',
        type: 'voltage',
        description: `Voltage too high: ${voltage}V`,
        value: voltage,
        threshold: THRESHOLDS.VOLTAGE_HIGH,
      });
      await anomaly.save();
      anomalies.push(anomaly);
    } else if (voltage < THRESHOLDS.VOLTAGE_LOW) {
      const anomaly = new Anomaly({
        cellId,
        severity: 'high',
        type: 'voltage',
        description: `Voltage too low: ${voltage}V`,
        value: voltage,
        threshold: THRESHOLDS.VOLTAGE_LOW,
      });
      await anomaly.save();
      anomalies.push(anomaly);
    }

    return anomalies;
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return [];
  }
};

module.exports = { detectAnomalies, THRESHOLDS };
