const fs = require('fs').promises;
const path = require('path');
const Movie = require('../models/movie');

const DATA_PATH = path.join(__dirname, '..', 'data', 'movies.json');

async function ensureDataFile() {
    try {
        await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
        // If file doesn't exist, create with empty array
        try {
            await fs.access(DATA_PATH);
        } catch (e) {
            await fs.writeFile(DATA_PATH, JSON.stringify([], null, 2));
        }
    } catch (err) {
        console.error('Error ensuring data file:', err);
    }
}

async function syncAllMoviesToJson() {
    try {
        await ensureDataFile();
        const movies = await Movie.find().lean();
        await fs.writeFile(DATA_PATH, JSON.stringify(movies, null, 2));
        return true;
    } catch (err) {
        console.error('Failed to sync movies to JSON:', err);
        return false;
    }
}

module.exports = { syncAllMoviesToJson, DATA_PATH };