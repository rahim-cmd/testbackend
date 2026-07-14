const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

const {
    registerValidation
} = require("../validators/authValidator");

router.post(
    "/register",
    registerValidation,
    authController.register
);

module.exports = router;