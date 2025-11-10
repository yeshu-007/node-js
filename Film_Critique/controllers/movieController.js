const Movie = require('../models/movie');
const { syncAllMoviesToJson } = require('../utils/syncToJson');
const https = require('https');

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function fetchJsonFromUri(uri) {
    // Use global fetch if available
    if (typeof globalThis.fetch === 'function') {
        const res = await fetch(uri);
        if (!res.ok) throw new Error(`Failed to fetch URI: ${res.status}`);
        return await res.json();
    }

    // Fallback to https.get
    return new Promise((resolve, reject) => {
        https.get(uri, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

// Create a new movie
const createMovie = async (req, res, next) => {
    try {
        const movie = new Movie(req.body);
        await movie.save();
        // Sync to JSON backup after successful create
        await syncAllMoviesToJson();
        res.status(201).json({ message: "Movie created successfully", movie });
    } catch (err) {
        next(err);
    }
};

// Get all movies
const getAllMovies = async (req, res, next) => {
    try {
        const movies = await Movie.find();
        res.status(200).json(movies);
    } catch (err) {
        next(err);
    }
};

const getMovieById = async (req, res, next) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.status(200).json(movie);
    } catch (err) {
        next(err);
    }
};

const updateMovie = async (req, res, next) => {
    try {
        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        // Sync backup
        await syncAllMoviesToJson();
        res.status(200).json({ message: "Movie updated successfully", movie });
    } catch (err) {
        next(err);
    }
};

const deleteMovie = async (req, res, next) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        // Sync backup
        await syncAllMoviesToJson();
        res.status(200).json({ message: "Movie deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// Import movies either from a remote URI (JSON) or from request body (object or array)
const importMovies = async (req, res, next) => {
    try {
        let payload = req.body;

        // If a uri field is provided, fetch JSON from it
        if (payload && payload.uri && typeof payload.uri === 'string') {
            payload = await fetchJsonFromUri(payload.uri);
        }

        // Accept single object or array
        const items = Array.isArray(payload) ? payload : [payload];

        const inserted = [];
        const skipped = [];

        for (const item of items) {
            if (!item) continue;
            const { title, category, releaseyear, rating, isFeatures } = item;

            // Basic validation similar to middleware
            if (!title || !category || releaseyear === undefined || rating === undefined) {
                skipped.push({ title: title || null, reason: 'missing required fields' });
                continue;
            }
            if (typeof rating !== 'number' || rating < 0 || rating > 10) {
                skipped.push({ title, reason: 'invalid rating' });
                continue;
            }
            if (typeof releaseyear !== 'number' || releaseyear < 1900) {
                skipped.push({ title, reason: 'invalid year' });
                continue;
            }

            // Check duplicate title (case-insensitive)
            const existing = await Movie.findOne({ title: { $regex: `^${escapeRegExp(title)}$`, $options: 'i' } });
            if (existing) {
                skipped.push({ title, reason: 'duplicate' });
                continue;
            }

            const movie = new Movie({ title, category, releaseyear, rating, isFeatures: !!isFeatures });
            await movie.save();
            inserted.push(movie);
        }

        // Sync backup after changes
        await syncAllMoviesToJson();

        res.status(201).json({ insertedCount: inserted.length, skipped, inserted });
    } catch (err) {
        next(err);
    }
};

const getTopRatedMovies = async (req, res, next) => {
    try {
        const movies = await Movie.find({ rating: { $gte: 8.5 } });
        res.status(200).json(movies);
    } catch (err) {
        next(err);
    }
};

const getMoviesByCategory = async (req, res, next) => {
    try {
        const movies = await Movie.find({ 
            category: { 
                $regex: new RegExp(req.params.category, 'i') 
            } 
        });
        res.status(200).json(movies);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie,
    importMovies,
    getTopRatedMovies,
    getMoviesByCategory
};