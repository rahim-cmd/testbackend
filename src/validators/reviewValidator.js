const { body, param, query } = require("express-validator");

const reviewCreateValidation = [
    param("bookingId")
        .isInt({ min: 1 })
        .withMessage("Booking id must be a positive integer."),

    body("rating")
        .notEmpty()
        .withMessage("Rating is required.")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5."),

    body("review_text")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ min: 5, max: 1500 })
        .withMessage("Review text must be between 5 and 1500 characters."),

    body("is_public")
        .optional()
        .isBoolean()
        .withMessage("is_public must be true or false."),
];

const homepageReviewValidation = [
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("limit must be between 1 and 100."),

    query("circle_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("circle_id must be a positive integer."),
];

const reviewDeleteValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Review id must be a positive integer."),
];

const adminReviewListValidation = [
    query("status")
        .optional()
        .isIn(["pending", "approved", "rejected"])
        .withMessage("status must be pending, approved, or rejected."),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage("limit must be between 1 and 200."),

    query("circle_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("circle_id must be a positive integer."),
];

const reviewModerationValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Review id must be a positive integer."),

    body("status")
        .notEmpty()
        .withMessage("status is required.")
        .isIn(["approved", "rejected"])
        .withMessage("status must be approved or rejected."),

    body("note")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 1000 })
        .withMessage("note cannot exceed 1000 characters."),
];

module.exports = {
    reviewCreateValidation,
    homepageReviewValidation,
    reviewDeleteValidation,
    adminReviewListValidation,
    reviewModerationValidation,
};
