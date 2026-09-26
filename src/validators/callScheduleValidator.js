const { body, param, query } = require("express-validator");

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const createSlotsValidation = [
    body("dates")
        .isArray({ min: 1 })
        .withMessage("dates must be a non-empty array."),

    body("dates.*.date")
        .isISO8601()
        .withMessage("Each date must be a valid date (YYYY-MM-DD)."),

    body("dates.*.times")
        .isArray({ min: 1 })
        .withMessage("Each date must have at least one time slot."),

    body("dates.*.times.*")
        .matches(TIME_PATTERN)
        .withMessage("Each time slot must be in HH:MM 24-hour format."),
];

const publicAvailabilityValidation = [
    query("month")
        .optional()
        .matches(MONTH_PATTERN)
        .withMessage("month must be in YYYY-MM format."),
];

const adminSlotsValidation = [
    query("month")
        .optional()
        .matches(MONTH_PATTERN)
        .withMessage("month must be in YYYY-MM format."),

    query("status")
        .optional()
        .isIn(["available", "booked", "cancelled"])
        .withMessage("status must be available, booked, or cancelled."),
];

const deleteSlotValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Slot id must be a positive integer."),
];

const createCallBookingValidation = [
    body("slot_id")
        .isInt({ min: 1 })
        .withMessage("slot_id must be a positive integer."),

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
];

const adminCallBookingsValidation = [
    query("status")
        .optional()
        .isIn(["pending", "confirmed", "cancelled", "completed"])
        .withMessage("status must be pending, confirmed, cancelled, or completed."),
];

const updateCallBookingStatusValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Booking id must be a positive integer."),

    body("status")
        .notEmpty()
        .withMessage("status is required.")
        .isIn(["confirmed", "cancelled", "completed"])
        .withMessage("status must be confirmed, cancelled, or completed."),

    body("admin_note")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 1000 })
        .withMessage("admin_note cannot exceed 1000 characters."),
];

module.exports = {
    createSlotsValidation,
    publicAvailabilityValidation,
    adminSlotsValidation,
    deleteSlotValidation,
    createCallBookingValidation,
    adminCallBookingsValidation,
    updateCallBookingStatusValidation,
};
