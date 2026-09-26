const { body, param, query } = require("express-validator");

const allotMemberValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Cohort id must be a positive integer."),

    body("user_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("user_id must be a positive integer."),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("email must be a valid email."),

    body("waitlist_entry_id")
        .optional()
        .isInt({ min: 1 })
        .withMessage("waitlist_entry_id must be a positive integer."),
];

const cohortIdParamValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Cohort id must be a positive integer."),
];

const memberIdParamValidation = [
    param("memberId")
        .isInt({ min: 1 })
        .withMessage("Member id must be a positive integer."),
];

const updateMemberStatusValidation = [
    param("memberId")
        .isInt({ min: 1 })
        .withMessage("Member id must be a positive integer."),

    body("status")
        .notEmpty()
        .withMessage("status is required.")
        .isIn(["active", "completed", "cancelled"])
        .withMessage("status must be active, completed, or cancelled."),
];

const updateMemberJoinControlValidation = [
    param("memberId")
        .isInt({ min: 1 })
        .withMessage("Member id must be a positive integer."),

    body("is_enabled")
        .notEmpty()
        .withMessage("is_enabled is required.")
        .isBoolean()
        .withMessage("is_enabled must be true or false."),

    body("reason")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 500 })
        .withMessage("reason cannot exceed 500 characters."),
];

const joinSessionValidation = [
    param("memberId")
        .isInt({ min: 1 })
        .withMessage("Member id must be a positive integer."),

    param("sessionId")
        .isInt({ min: 1 })
        .withMessage("Session id must be a positive integer."),
];

const sendDirectLinkValidation = [
    param("sessionId")
        .isInt({ min: 1 })
        .withMessage("Session id must be a positive integer."),

    param("memberId")
        .isInt({ min: 1 })
        .withMessage("Member id must be a positive integer."),

    body("admin_note")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 500 })
        .withMessage("admin_note cannot exceed 500 characters."),
];

const createSessionsValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Cohort id must be a positive integer."),

    body("sessions")
        .isArray({ min: 1 })
        .withMessage("sessions must be a non-empty array."),

    body("sessions.*.week_number")
        .isInt({ min: 1, max: 52 })
        .withMessage("week_number must be a positive integer."),

    body("sessions.*.session_date")
        .isISO8601()
        .withMessage("session_date must be a valid date."),

    body("sessions.*.start_time")
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
        .withMessage("start_time must be in HH:MM 24-hour format."),

    body("sessions.*.end_time")
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
        .withMessage("end_time must be in HH:MM 24-hour format."),

    body("sessions.*.theme")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 255 })
        .withMessage("theme cannot exceed 255 characters."),
];

const updateSessionValidation = [
    param("sessionId")
        .isInt({ min: 1 })
        .withMessage("Session id must be a positive integer."),

    body("theme")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 255 })
        .withMessage("theme cannot exceed 255 characters."),

    body("session_date")
        .optional()
        .isISO8601()
        .withMessage("session_date must be a valid date."),

    body("start_time")
        .optional()
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
        .withMessage("start_time must be in HH:MM 24-hour format."),

    body("end_time")
        .optional()
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
        .withMessage("end_time must be in HH:MM 24-hour format."),
];

module.exports = {
    allotMemberValidation,
    cohortIdParamValidation,
    memberIdParamValidation,
    updateMemberStatusValidation,
    updateMemberJoinControlValidation,
    joinSessionValidation,
    sendDirectLinkValidation,
    createSessionsValidation,
    updateSessionValidation,
};
