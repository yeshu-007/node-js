// models/Trip.js
const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  departDate: { type: String }, 
  arrivalDate: { type: String },
  placesVisited: [{ type: String }],
  about: { type: String },
  tips: { type: String },
  budget: { type: Number, default: 0 },
  category: { type: String, default: 'Leisure' },
  photos: [{ type: String }], 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TripSchema.pre('save', function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Trip', TripSchema);
