const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");

const {
    registerValidation,
    loginValidation,
    changePasswordValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
} = require("../validators/authValidator");

router.post(
    "/register",
    registerValidation,
    authController.register
);
router.post(
    "/login",
    loginValidation,
    authController.login
);

router.get(
    "/profile",
    authenticate,
    authController.getProfile
);

router.post(
    "/logout",
    authenticate,
    authController.logout
);

router.post(
    "/change-password",
    authenticate,
    changePasswordValidation,
    authController.changePassword
);

router.post(
    "/forgot-password",
    forgotPasswordValidation,
    authController.forgotPassword
);

router.post(
    "/reset-password",
    resetPasswordValidation,
    authController.resetPassword
);

module.exports = router;