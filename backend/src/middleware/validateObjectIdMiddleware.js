const mongoose = require("mongoose");

const validateObjectId = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: `Invalid ${paramName}`
            });
        }

        return next();
    };
};

module.exports = validateObjectId;