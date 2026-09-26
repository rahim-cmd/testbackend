const express = require("express");
const { query } = require("express-validator");

const router = express.Router();

const testimonialController = require("../controllers/testimonialController");

const testimonialListValidation = [
    query("limit")
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage("limit must be between 1 and 200."),
];

router.get(
    "/",
    testimonialListValidation,
    testimonialController.getTestimonials
);

module.exports = router;
