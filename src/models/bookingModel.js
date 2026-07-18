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
            COALESCE(booking_counts.booked_members, 0) AS booked_members,
            title,
            description,
            meeting_date,
            start_time,
            end_time,
            zoom_link,
            zoom_meeting_id,
            zoom_start_url,
            zoom_password,
            zoom_start_time,
            zoom_duration
        FROM circle_events
        LEFT JOIN (
            SELECT circle_id, COUNT(*) AS booked_members
            FROM bookings
            WHERE booking_status = 'approved'
            GROUP BY circle_id
        ) booking_counts ON booking_counts.circle_id = circle_events.id
        WHERE id = ?`,

        [circleId]

    );

    return rows[0];

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

const getMyBookings = async (userId) => {

    const [rows] = await db.execute(

        `SELECT

            b.id,
            b.booking_status,
            b.notes,
            b.approved_at,
            b.created_at,

            c.title,
            c.description,
            c.meeting_date,
            c.start_time,
            c.end_time,
            c.host_name,
            COALESCE(zm.meeting_id, c.zoom_meeting_id) AS zoom_meeting_id,
            COALESCE(zm.join_url, c.zoom_link) AS zoom_link,
            COALESCE(zm.start_time, c.zoom_start_time) AS zoom_start_time,
            COALESCE(zm.duration, c.zoom_duration) AS zoom_duration,
            zm.updated_at AS zoom_updated_at

        FROM bookings b

        INNER JOIN circle_events c
            ON b.circle_id = c.id

        LEFT JOIN zoom_meetings zm
            ON zm.booking_id = b.id

        WHERE b.user_id = ?

        ORDER BY c.meeting_date ASC,
                 c.start_time ASC`,

        [userId]

    );

    return rows;

};

const getAllBookings = async () => {
    const [rows] = await db.execute(
        `SELECT
            b.id,
            b.booking_status,
            b.notes,
            b.approved_at,
            b.created_at,
            u.first_name,
            u.last_name,
            u.email,
            c.title,
            c.meeting_date,
            c.start_time,
            c.end_time,
            zm.join_url AS zoom_link,
            zm.updated_at AS zoom_updated_at
        FROM bookings b
        INNER JOIN users u ON b.user_id = u.id
        INNER JOIN circle_events c ON b.circle_id = c.id
        LEFT JOIN zoom_meetings zm ON zm.booking_id = b.id
        ORDER BY b.created_at DESC`
    );

    return rows;
};

const updateBookingStatus = async (connection, bookingId, status, adminId, note) => {
    const [result] = await connection.execute(
        `UPDATE bookings
         SET booking_status = ?, approved_by = ?, approved_at = NOW(), notes = ?
         WHERE id = ?`,
        [status, adminId, note || null, bookingId]
    );

    return result.affectedRows;
};

const getBookingByIdForAdmin = async (bookingId) => {
    const [rows] = await db.execute(
        `SELECT id, circle_id, booking_status FROM bookings WHERE id = ? LIMIT 1`,
        [bookingId]
    );

    return rows[0];
};

const getBookingUser = async (bookingId) => {
    const [rows] = await db.execute(
        `SELECT u.first_name, u.last_name, u.email
         FROM bookings b
         INNER JOIN users u ON b.user_id = u.id
         WHERE b.id = ? LIMIT 1`,
        [bookingId]
    );

    return rows[0];
};

const getCircleDetails = async (bookingId) => {
    const [rows] = await db.execute(
        `SELECT
            c.title,
            c.zoom_link,
            c.zoom_meeting_id,
            c.zoom_start_url,
            c.zoom_password,
            c.zoom_start_time,
            c.zoom_duration,
            c.meeting_date,
            c.start_time,
            c.end_time,
            c.description
         FROM bookings b
         INNER JOIN circle_events c ON b.circle_id = c.id
         WHERE b.id = ? LIMIT 1`,
        [bookingId]
    );

    return rows[0];
};

const updateCircleZoomConfig = async (connection, circleId, zoomData) => {
    const [result] = await connection.execute(
        `UPDATE circle_events
         SET
            zoom_link = ?,
            zoom_meeting_id = ?,
            zoom_start_url = ?,
            zoom_password = ?,
            zoom_start_time = ?,
            zoom_duration = ?
         WHERE id = ?`,
        [
            zoomData.zoom_link,
            zoomData.zoom_meeting_id,
            zoomData.zoom_start_url,
            zoomData.zoom_password,
            zoomData.zoom_start_time,
            zoomData.zoom_duration,
            circleId,
        ]
    );

    return result.affectedRows > 0;
};

const cancelBooking = async (connection, bookingId, userId) => {

    const [result] = await connection.execute(

        `UPDATE bookings
         SET booking_status = 'cancelled'
         WHERE id = ?
         AND user_id = ?
         AND booking_status = 'pending'`,

        [
            bookingId,
            userId
        ]

    );

    return result.affectedRows;

};

const getBookingById = async (bookingId, userId) => {

    const [rows] = await db.execute(

        `SELECT
            id,
            circle_id,
            booking_status
        FROM bookings
        WHERE id = ?
        AND user_id = ?`,

        [
            bookingId,
            userId
        ]

    );

    return rows[0];

};





module.exports = {

    createBooking,
    getCircleById,
    getExistingBooking,
    getMyBookings,
    getAllBookings,
    updateBookingStatus,
    getBookingByIdForAdmin,
    getBookingUser,
    getCircleDetails,
    updateCircleZoomConfig,
    cancelBooking,
    getBookingById
};
   