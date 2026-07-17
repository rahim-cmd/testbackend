const { body } = require("express-validator");

const adminCreateUserValidation = [
    body("first_name")
        .trim()
        .notEmpty()
        .withMessage("First name is required.")
        .isLength({ min: 2, max: 100 })
        .withMessage("First name must be between 2 and 100 characters."),

    body("last_name")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Last name cannot exceed 100 characters."),

    body("email")
        .trim()
        .toLowerCase()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Please enter a valid email address."),

    body("phone")
        .optional()
        .trim(),

    body("password")
        .notEmpty()
        .withMessage("Password is required.")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long."),

    body("role")
        .optional()
        .isIn(["user", "admin"])
        .withMessage("Role must be either user or admin."),

    body("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be either active or inactive."),

    body("email_verified")
        .optional()
        .isBoolean()
        .withMessage("Email verified must be a boolean value."),
];

const adminUpdateUserValidation = [
    body("first_name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("First name must be between 2 and 100 characters."),

    body("last_name")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Last name cannot exceed 100 characters."),

    body("email")
        .optional()
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage("Please enter a valid email address."),

    body("phone")
        .optional()
        .trim(),

    body("password")
        .optional()
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long."),

    body("role")
        .optional()
        .isIn(["user", "admin"])
        .withMessage("Role must be either user or admin."),

    body("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be either active or inactive."),

    body("email_verified")
        .optional()
        .isBoolean()
        .withMessage("Email verified must be a boolean value."),
];

module.exports = {
    adminCreateUserValidation,
    adminUpdateUserValidation,
};
