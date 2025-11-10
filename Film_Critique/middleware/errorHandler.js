const errorHandlerMiddleware = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: "Validation failed: " + err.message
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            message: "Validation failed: Movie title already exists"
        });
    }

    res.status(500).json({
        message: "Internal server error"
    });
};

module.exports = errorHandlerMiddleware;