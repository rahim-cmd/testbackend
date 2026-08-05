const { body } = require("express-validator");

const registerValidation = [

    body("first_name")
        .trim()
        .notEmpty()
        .withMessage("First name is required.")
        .bail()
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
        .withMessage("Password must be at least 8 characters long.")

];

const loginValidation = [

    body("email")
        .trim()
        .toLowerCase()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Please enter a valid email address."),

    body("password")
        .notEmpty()
        .withMessage("Password is required.")

];

const changePasswordValidation = [
    body("current_password")
        .notEmpty()
        .withMessage("Current password is required."),

    body("new_password")
        .notEmpty()
        .withMessage("New password is required.")
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters long."),
];

const forgotPasswordValidation = [
    body("email")
        .trim()
        .toLowerCase()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Please enter a valid email address."),
];

const resetPasswordValidation = [
    body("token")
        .trim()
        .notEmpty()
        .withMessage("Reset token is required."),

    body("new_password")
        .notEmpty()
        .withMessage("New password is required.")
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters long."),

    body("otp")
        .optional()
        .trim()
        .isLength({ min: 4, max: 10 })
        .withMessage("OTP must be between 4 and 10 characters."),
];


module.exports = {
    registerValidation,
    loginValidation,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
};