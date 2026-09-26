const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const callScheduleController = require("../controllers/callScheduleController");
const {
    createSlotsValidation,
    publicAvailabilityValidation,
    adminSlotsValidation,
    deleteSlotValidation,
    createCallBookingValidation,
    adminCallBookingsValidation,
    updateCallBookingStatusValidation,
} = require("../validators/callScheduleValidator");

router.get(
    "/slots",
    publicAvailabilityValidation,
    callScheduleController.getPublicAvailability
);

router.post(
    "/bookings",
    createCallBookingValidation,
    callScheduleController.createCallBooking
);

router.post(
    "/admin/slots",
    authenticate,
    authenticate.isAdmin,
    createSlotsValidation,
    callScheduleController.createAvailabilitySlots
);

router.get(
    "/admin/slots",
    authenticate,
    authenticate.isAdmin,
    adminSlotsValidation,
    callScheduleController.getAdminSlots
);

router.delete(
    "/admin/slots/:id",
    authenticate,
    authenticate.isAdmin,
    deleteSlotValidation,
    callScheduleController.deleteAvailabilitySlot
);

router.get(
    "/admin/bookings",
    authenticate,
    authenticate.isAdmin,
    adminCallBookingsValidation,
    callScheduleController.getAllCallBookings
);

router.put(
    "/admin/bookings/:id/status",
    authenticate,
    authenticate.isAdmin,
    updateCallBookingStatusValidation,
    callScheduleController.updateCallBookingStatus
);

module.exports = router;
