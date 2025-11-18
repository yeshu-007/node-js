// routes/trips.js
const express = require('express');
const Trip = require('../models/Trip');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if(req.query.owner) filter.owner = req.query.owner;
    const trips = await Trip.find(filter).sort({ createdAt: -1 }).lean();
    res.json(trips);
  } catch(err) {
    console.error('get trips', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const trip = new Trip({
      owner: req.user._id,
      title: body.title,
      departDate: body.departDate,
      arrivalDate: body.arrivalDate,
      placesVisited: Array.isArray(body.placesVisited) ? body.placesVisited : (body.placesVisited ? [body.placesVisited] : []),
      about: body.about || '',
      tips: body.tips || '',
      budget: body.budget || 0,
      category: body.category || 'Leisure',
      photos: Array.isArray(body.photos) ? body.photos : (body.photos ? [body.photos] : [])
    });
    await trip.save();
    res.status(201).json(trip);
  } catch(err) {
    console.error('create trip', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).lean();
    if(!trip) return res.status(404).json({ message: 'Not found' });
    res.json(trip);
  } catch(err) {
    console.error('get trip', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id', requireAuth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if(!trip) return res.status(404).json({ message: 'Not found' });

    if(String(trip.owner) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });

    const body = req.body || {};
  
    trip.title = body.title ?? trip.title;
    trip.departDate = body.departDate ?? trip.departDate;
    trip.arrivalDate = body.arrivalDate ?? trip.arrivalDate;
    trip.placesVisited = Array.isArray(body.placesVisited) ? body.placesVisited : trip.placesVisited;
    trip.about = body.about ?? trip.about;
    trip.tips = body.tips ?? trip.tips;
    trip.budget = body.budget ?? trip.budget;
    trip.category = body.category ?? trip.category;
    trip.photos = Array.isArray(body.photos) ? body.photos : trip.photos;

    await trip.save();
    res.json(trip);
  } catch(err) {
    console.error('update trip', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if(!trip) return res.status(404).json({ message: 'Not found' });
    if(String(trip.owner) !== String(req.user._id)) return res.status(403).json({ message: 'Not allowed' });

    await trip.deleteOne();
    res.json({ success: true });
  } catch(err) {
    console.error('delete trip', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
