const { body } = require("express-validator");

const circleCreateValidation = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("Title is required.")
        .isLength({ min: 3, max: 200 })
        .withMessage("Title must be between 3 and 200 characters."),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description cannot exceed 1000 characters."),

    body("meeting_date")
        .trim()
        .notEmpty()
        .withMessage("Meeting date is required."),

    body("start_time")
        .trim()
        .notEmpty()
        .withMessage("Start time is required."),

    body("end_time")
        .trim()
        .notEmpty()
        .withMessage("End time is required."),

    body("max_members")
        .notEmpty()
        .withMessage("Maximum members is required.")
        .isInt({ min: 1, max: 1000 })
        .withMessage("Maximum members must be between 1 and 1000."),

    body("zoom_link")
        .optional()
        .trim()
        .isURL()
        .withMessage("Zoom link must be a valid URL."),

    body("host_name")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Host name cannot exceed 200 characters.")
];

const circleUpdateValidation = [
    body("title")
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Title must be between 3 and 200 characters."),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Description cannot exceed 1000 characters."),

    body("meeting_date")
        .optional()
        .trim(),

    body("start_time")
        .optional()
        .trim(),

    body("end_time")
        .optional()
        .trim(),

    body("max_members")
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage("Maximum members must be between 1 and 1000."),

    body("zoom_link")
        .optional()
        .trim()
        .isURL()
        .withMessage("Zoom link must be a valid URL."),

    body("host_name")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Host name cannot exceed 200 characters.")
];

module.exports = {
    circleCreateValidation,
    circleUpdateValidation
};
