const notFound = (req, res, next) => {
    return res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

const errorHandler = (err, req, res, next) => {
    console.error(err.message);

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = res.statusCode >= 400
        ? res.statusCode
        : 500;

    return res.status(statusCode).json({
        message: statusCode === 500
            ? "Internal server error"
            : err.message
    });
};

module.exports = {
    notFound,
    errorHandler
};