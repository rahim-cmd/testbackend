const db = require("../config/db");

const createBooking = async (bookingData) => {

    const [result] = await db.execute(

        `INSERT INTO bookings
        (
            user_id,
            circle_id,
            payment_status,
            booking_status
        )
        VALUES
        (?, ?, ?, ?)`,

        [
            bookingData.user_id,
            bookingData.circle_id,
            "pending",
            "pending"
        ]

    );

    return result.insertId;

};

module.exports = {

    createBooking

};