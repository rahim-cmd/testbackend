const bookingService = require("../services/bookingService");

const getAllBookings = async (req, res) => {
    try {
        const bookings = await bookingService.getAllBookings();

        return res.status(200).json({
            success: true,
            data: bookings,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const createBooking = async (req, res) => {

    try {

        const result = await bookingService.createBooking({

            user_id: req.user.id,

            circle_id: req.body.circle_id

        });

        return res.status(201).json({

            success: true,

            message: "Booking request submitted.",

            data: result

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const getMyBookings = async (req, res) => {

    try {

        const bookings =
            await bookingService.getMyBookings(
                req.user.id
            );

        return res.status(200).json({

            success: true,

            data: bookings

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const updateBookingStatus = async (req, res) => {
    try {
        const result = await bookingService.updateBookingStatus({
            bookingId: req.params.id,
            status: req.body.status,
            reason: req.body.reason,
            adminId: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: `Booking ${req.body.status} successfully.`,
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const approveBooking = async (req, res) => {
    try {
        const result = await bookingService.updateBookingStatus({
            bookingId: req.params.id,
            status: "approved",
            reason: req.body.reason,
            adminId: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: "Booking approved successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const rejectBooking = async (req, res) => {
    try {
        const result = await bookingService.updateBookingStatus({
            bookingId: req.params.id,
            status: "rejected",
            reason: req.body.reason,
            adminId: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: "Booking rejected successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const cancelBooking = async (req, res) => {

    try {

        await bookingService.cancelBooking(

            req.params.id,

            req.user.id

        );

        return res.status(200).json({

            success: true,

            message: "Booking cancelled successfully."

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


module.exports = {

    createBooking,
    getMyBookings,
    getAllBookings,
    updateBookingStatus,
    approveBooking,
    rejectBooking,
    cancelBooking

};