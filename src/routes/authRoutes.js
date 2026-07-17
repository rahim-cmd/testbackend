const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");

const {
    registerValidation,
    loginValidation
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

module.exports = router;