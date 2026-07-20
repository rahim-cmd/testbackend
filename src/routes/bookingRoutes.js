const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");

const bookingController = require("../controllers/bookingController");

router.post(

    "/",

    authenticate,

    bookingController.createBooking

);
router.get(

    "/my",

    authenticate,

    bookingController.getMyBookings

);

router.get(

    "/admin",

    authenticate,
    authenticate.isAdmin,
    bookingController.getAllBookings

);
router.put(

    "/:id/status",

    authenticate,
    authenticate.isAdmin,
    bookingController.updateBookingStatus

);

router.put(

    "/:id/approve",

    authenticate,
    authenticate.isAdmin,
    bookingController.approveBooking

);

router.put(

    "/:id/reject",

    authenticate,
    authenticate.isAdmin,
    bookingController.rejectBooking

);

router.put(

    "/:id/cancel",

    authenticate,

    bookingController.cancelBooking

);

router.post(

    "/:id/join/start",

    authenticate,

    bookingController.startJoinSession

);

router.post(

    "/:id/join/end",

    authenticate,

    bookingController.endJoinSession

);

router.put(

    "/:id/join/control",

    authenticate,
    authenticate.isAdmin,
    bookingController.updateJoinControl

);

router.put(

    "/circle/:circleId/join/control",

    authenticate,
    authenticate.isAdmin,
    bookingController.updateCircleJoinControl

);

router.get(

    "/:id/join/logs",

    authenticate,
    authenticate.isAdmin,
    bookingController.getJoinLogs

);

module.exports = router;