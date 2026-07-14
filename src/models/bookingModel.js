const db = require("../config/db");

const createBooking = async (connection, bookingData) => {

    const [result] = await connection.execute(

        `INSERT INTO bookings
        (
            user_id,
            circle_id,
            booking_status
        )
        VALUES (?, ?, ?)`,

        [
            bookingData.user_id,
            bookingData.circle_id,
            "pending"
        ]

    );

    return result.insertId;

};

const getCircleById = async (circleId) => {

    const [rows] = await db.execute(

        `SELECT
            id,
            status,
            booking_open,
            max_members,
            booked_members
        FROM circle_events
        WHERE id = ?`,

        [circleId]

    );

    return rows[0];

};

const incrementBookedMembers = async (
    connection,
    circleId
) => {

    await connection.execute(

        `UPDATE circle_events
         SET booked_members = booked_members + 1
         WHERE id = ?`,

        [circleId]

    );

};

const getExistingBooking = async (userId, circleId) => {

    const [rows] = await db.execute(

        `SELECT id
         FROM bookings
         WHERE user_id = ?
         AND circle_id = ?
         AND booking_status != 'cancelled'
         LIMIT 1`,

        [
            userId,
            circleId
        ]

    );

    return rows[0];

};



module.exports = {

    createBooking,
    getCircleById,
    getExistingBooking,
    incrementBookedMembers
};
   