const { validationResult } = require("express-validator");
const callScheduleService = require("../services/callScheduleService");

const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });

        return true;
    }

    return false;
};

const createAvailabilitySlots = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await callScheduleService.createAvailabilitySlots({
            dates: req.body.dates,
            adminId: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: "Availability slots created successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getPublicAvailability = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const data = await callScheduleService.getPublicAvailability({
            month: req.query.month,
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getAdminSlots = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const data = await callScheduleService.getAdminSlots({
            month: req.query.month,
            status: req.query.status,
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteAvailabilitySlot = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        await callScheduleService.deleteAvailabilitySlot(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Availability slot deleted successfully.",
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const createCallBooking = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await callScheduleService.createCallBooking({
            slotId: req.body.slot_id,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            message: req.body.message,
        });

        return res.status(201).json({
            success: true,
            message: "Call request submitted successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getAllCallBookings = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const data = await callScheduleService.getAllCallBookingsForAdmin({
            status: req.query.status,
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateCallBookingStatus = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await callScheduleService.updateCallBookingStatus({
            bookingId: req.params.id,
            status: req.body.status,
            adminNote: req.body.admin_note,
        });

        return res.status(200).json({
            success: true,
            message: `Call booking marked as ${req.body.status}.`,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createAvailabilitySlots,
    getPublicAvailability,
    getAdminSlots,
    deleteAvailabilitySlot,
    createCallBooking,
    getAllCallBookings,
    updateCallBookingStatus,
};
