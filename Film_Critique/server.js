//BY MEGHANA. S AND YESHWANTH. R

const express = require('express');
const mongoose = require('mongoose');
const movieRoutes = require('./src/routes/movieRoutes');
const loggerMiddleware = require('./src/middleware/logger');
const errorHandlerMiddleware = require('./src/middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(loggerMiddleware);

mongoose.connect('mongodb://127.0.0.1:27017/cinecritic')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

app.use('/api/movies', movieRoutes);

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
   
