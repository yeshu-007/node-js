const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const validateMovieMiddleware = require('../middleware/validateMovie');

// Create and list
router.post('/', validateMovieMiddleware, movieController.createMovie);
router.get('/', movieController.getAllMovies);

// Import from URI or JSON body
router.post('/import', movieController.importMovies);

// Custom routes (place before param routes to avoid conflicts)
router.get('/top-rated', movieController.getTopRatedMovies);
router.get('/category/:category', movieController.getMoviesByCategory);

// Routes that use :id param
router.get('/:id', movieController.getMovieById);
router.put('/:id', validateMovieMiddleware, movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);

module.exports = router;