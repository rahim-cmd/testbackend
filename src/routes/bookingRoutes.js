const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");

const bookingController = require("../controllers/bookingController");

router.post(

    "/",

    authenticate,

    bookingController.createBooking

);

module.exports = router;