const validateMovieMiddleware = (req, res, next) => {
    const { title, category, releaseyear, rating } = req.body;

    // If any required field is missing or rating/year invalid, respond with the
    // unified message required by the spec.
    if (!title || !category || !releaseyear || rating === undefined) {
        return res.status(400).json({ message: "Validation failed: Invalid rating or year." });
    }

    if (typeof rating !== 'number' || rating < 0 || rating > 10) {
        return res.status(400).json({ message: "Validation failed: Invalid rating or year." });
    }

    if (typeof releaseyear !== 'number' || releaseyear < 1900) {
        return res.status(400).json({ message: "Validation failed: Invalid rating or year." });
    }

    next();
};

module.exports = validateMovieMiddleware;