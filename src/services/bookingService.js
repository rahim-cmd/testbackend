const bookingModel = require("../models/bookingModel");
const db = require("../config/db");

const createBooking = async (bookingData) => {

    const circle = await bookingModel.getCircleById(
        bookingData.circle_id
    );

    if (!circle) {
        throw new Error("Circle not found.");
    }

    if (!circle.booking_open) {
        throw new Error("Booking is closed.");
    }

    if (circle.booked_members >= circle.max_members) {
        throw new Error("Circle is full.");
    }

    const existingBooking =
        await bookingModel.getExistingBooking(
            bookingData.user_id,
            bookingData.circle_id
        );

    if (existingBooking) {
        throw new Error(
            "You have already booked this circle."
        );
    }

    // Transaction Start
    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const bookingId =
            await bookingModel.createBooking(
                connection,
                bookingData
            );

        await bookingModel.incrementBookedMembers(
            connection,
            bookingData.circle_id
        );

        await connection.commit();

        return {
            id: bookingId
        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }

};

module.exports = {
    createBooking
};