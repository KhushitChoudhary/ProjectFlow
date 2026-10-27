const { body, validationResult } = require("express-validator");

const validateTask = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Task title is required")
        .isLength({ max: 200 })
        .withMessage("Task title cannot exceed 200 characters"),

    body("priority")
        .optional()
        .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
        .withMessage("Invalid task priority"),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array()
            });
        }

        return next();
    }
];

module.exports = validateTask;