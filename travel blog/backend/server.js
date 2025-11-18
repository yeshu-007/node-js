// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(morgan('dev'));
app.use(cors()); 
app.use(express.json({ limit: '5mb' })); 


app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use('/api/uploads', uploadRoutes);

app.get('/', (req, res) => res.json({ ok: true, msg: 'Travel Diary API' }));


mongoose.connect(process.env.MONGO_URI)
.then(()=> {
  console.log('Connected to MongoDB ');
  app.listen(PORT, ()=> console.log(`Server running on ${PORT} at url: http://localhost:${PORT}`));
}).catch(err=>{
  console.error('Mongo connection error:', err);
  process.exit(1);
});


