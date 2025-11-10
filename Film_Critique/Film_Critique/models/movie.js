const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    releaseyear: {
        type: Number,
        required: true,
        validate: {
            validator: function(year) {
                return year >= 1900;
            },
            message: 'Release year must be 1900 or later'
        }
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },
    isFeatures: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

movieSchema.index({ title: 1 }, { 
    unique: true,
    collation: { locale: 'en', strength: 2 }
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;