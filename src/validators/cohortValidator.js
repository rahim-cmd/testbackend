const { body, param, query } = require("express-validator");

const createCohortValidation = [
    body("title")
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage("Title must be between 3 and 200 characters."),

    body("description")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 2000 })
        .withMessage("Description cannot exceed 2000 characters."),

    body("price")
        .notEmpty()
        .withMessage("Price is required.")
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number."),

    body("max_members")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Maximum members must be between 1 and 100."),

    body("duration_weeks")
        .optional()
        .isInt({ min: 1, max: 52 })
        .withMessage("Duration weeks must be between 1 and 52."),

    body("session_duration_minutes")
        .optional()
        .isInt({ min: 1, max: 480 })
        .withMessage("Session duration must be between 1 and 480 minutes."),

    body("start_date")
        .optional({ values: "falsy" })
        .isISO8601()
        .withMessage("Start date must be a valid date."),

    body("features")
        .optional()
        .isArray()
        .withMessage("Features must be an array of strings."),

    body("status")
        .optional()
        .isIn(["draft", "open", "full", "closed"])
        .withMessage("status must be draft, open, full, or closed."),
];

const updateCohortValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Cohort id must be a positive integer."),

    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price must be a positive number."),

    body("max_members")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Maximum members must be between 1 and 100."),

    body("seats_taken")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Seats taken must be zero or a positive integer."),

    body("features")
        .optional()
        .isArray()
        .withMessage("Features must be an array of strings."),

    body("status")
        .optional()
        .isIn(["draft", "open", "full", "closed"])
        .withMessage("status must be draft, open, full, or closed."),
];

const cohortIdParamValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Cohort id must be a positive integer."),
];

const joinWaitlistValidation = [
    body("name")
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage("Name must be between 2 and 150 characters."),

    body("email")
        .trim()
        .isEmail()
        .withMessage("A valid email is required."),

    body("phone")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 30 })
        .withMessage("Phone number cannot exceed 30 characters."),

    body("message")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 1000 })
        .withMessage("Message cannot exceed 1000 characters."),

    body("cohort_id")
        .optional({ values: "falsy" })
        .isInt({ min: 1 })
        .withMessage("cohort_id must be a positive integer."),
];

const adminWaitlistListValidation = [
    query("status")
        .optional()
        .isIn(["pending", "contacted", "converted", "cancelled"])
        .withMessage("status must be pending, contacted, converted, or cancelled."),

    query("cohort_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("cohort_id must be a positive integer."),
];

const updateWaitlistStatusValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Waitlist entry id must be a positive integer."),

    body("status")
        .notEmpty()
        .withMessage("status is required.")
        .isIn(["pending", "contacted", "converted", "cancelled"])
        .withMessage("status must be pending, contacted, converted, or cancelled."),

    body("admin_note")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 1000 })
        .withMessage("admin_note cannot exceed 1000 characters."),
];

module.exports = {
    createCohortValidation,
    updateCohortValidation,
    cohortIdParamValidation,
    joinWaitlistValidation,
    adminWaitlistListValidation,
    updateWaitlistStatusValidation,
};
