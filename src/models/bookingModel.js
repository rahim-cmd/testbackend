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
            COALESCE(zm.start_url, c.zoom_start_url) AS zoom_start_url,
            COALESCE(zm.password, c.zoom_password) AS zoom_password,
            COALESCE(zm.start_time, c.zoom_start_time) AS zoom_start_time,
            COALESCE(zm.duration, c.zoom_duration) AS zoom_duration,
            COALESCE(bjc.is_enabled, 1) AS join_enabled,
            bjc.lock_reason AS join_lock_reason,
            bjc.locked_at AS join_locked_at,
            bjc.enabled_at AS join_enabled_at,
            bjc.disabled_at AS join_disabled_at,
            zm.updated_at AS zoom_updated_at

        FROM bookings b

        INNER JOIN circle_events c
            ON b.circle_id = c.id

        LEFT JOIN zoom_meetings zm
            ON zm.booking_id = b.id

        LEFT JOIN booking_join_controls bjc
            ON bjc.booking_id = b.id

        WHERE b.user_id = ?

        ORDER BY c.meeting_date ASC,
                 c.start_time ASC`,

        [userId]

    );

    return rows;

};

const getLatestBookingForUser = async (userId) => {

    const [rows] = await db.execute(

        `SELECT
            b.id,
            b.circle_id,
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
            COALESCE(zm.start_url, c.zoom_start_url) AS zoom_start_url,
            COALESCE(zm.password, c.zoom_password) AS zoom_password,
            COALESCE(zm.start_time, c.zoom_start_time) AS zoom_start_time,
            COALESCE(zm.duration, c.zoom_duration) AS zoom_duration,
            COALESCE(bjc.is_enabled, 1) AS join_enabled,
            bjc.lock_reason AS join_lock_reason,
            bjc.locked_at AS join_locked_at,
            bjc.enabled_at AS join_enabled_at,
            bjc.disabled_at AS join_disabled_at,
            zm.updated_at AS zoom_updated_at
        FROM bookings b
        INNER JOIN circle_events c
            ON b.circle_id = c.id
        LEFT JOIN zoom_meetings zm
            ON zm.booking_id = b.id
        LEFT JOIN booking_join_controls bjc
            ON bjc.booking_id = b.id
        WHERE b.user_id = ?
          AND b.booking_status != 'cancelled'
        ORDER BY b.created_at DESC
        LIMIT 1`,

        [userId]

    );

    return rows[0];

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
            COALESCE(zm.password, c.zoom_password) AS zoom_password,
            zm.join_url AS zoom_link,
            COALESCE(bjc.is_enabled, 1) AS join_enabled,
            bjc.lock_reason AS join_lock_reason,
            bjc.locked_at AS join_locked_at,
            zm.updated_at AS zoom_updated_at
        FROM bookings b
        INNER JOIN users u ON b.user_id = u.id
        INNER JOIN circle_events c ON b.circle_id = c.id
        LEFT JOIN zoom_meetings zm ON zm.booking_id = b.id
        LEFT JOIN booking_join_controls bjc ON bjc.booking_id = b.id
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

const getBookingJoinContext = async (bookingId, userId = null) => {

    const params = [bookingId];
    const userClause = userId === null ? "" : " AND b.user_id = ?";

    if (userId !== null) {
        params.push(userId);
    }

    const [rows] = await db.execute(

        `SELECT
            b.id,
            b.user_id,
            b.circle_id,
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
            COALESCE(zm.start_url, c.zoom_start_url) AS zoom_start_url,
            COALESCE(zm.password, c.zoom_password) AS zoom_password,
            COALESCE(zm.start_time, c.zoom_start_time) AS zoom_start_time,
            COALESCE(zm.duration, c.zoom_duration) AS zoom_duration,
            COALESCE(bjc.is_enabled, 1) AS join_enabled,
            bjc.lock_reason AS join_lock_reason,
            bjc.locked_at AS join_locked_at,
            bjc.enabled_at AS join_enabled_at,
            bjc.disabled_at AS join_disabled_at,
            bjc.locked_by_user_id AS join_locked_by_user_id,
            bjc.locked_by_admin_id AS join_locked_by_admin_id,
            zm.updated_at AS zoom_updated_at
        FROM bookings b
        INNER JOIN circle_events c ON b.circle_id = c.id
        LEFT JOIN zoom_meetings zm ON zm.booking_id = b.id
        LEFT JOIN booking_join_controls bjc ON bjc.booking_id = b.id
        WHERE b.id = ?${userClause}
        LIMIT 1`,

        params

    );

    return rows[0];

};

const setBookingJoinControl = async (connection, bookingId, controlData) => {

    const executor = connection || db;

    await executor.execute(

        `INSERT INTO booking_join_controls
            (booking_id, is_enabled, locked_by_user_id, locked_by_admin_id, lock_reason, locked_at, enabled_at, disabled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            is_enabled = VALUES(is_enabled),
            locked_by_user_id = VALUES(locked_by_user_id),
            locked_by_admin_id = VALUES(locked_by_admin_id),
            lock_reason = VALUES(lock_reason),
            locked_at = VALUES(locked_at),
            enabled_at = VALUES(enabled_at),
            disabled_at = VALUES(disabled_at)` ,

        [
            bookingId,
            controlData.is_enabled ? 1 : 0,
            controlData.locked_by_user_id || null,
            controlData.locked_by_admin_id || null,
            controlData.lock_reason || null,
            controlData.locked_at || null,
            controlData.enabled_at || null,
            controlData.disabled_at || null,
        ]

    );

};

const createBookingJoinLog = async (connection, logData) => {

    const executor = connection || db;

    await executor.execute(

        `INSERT INTO booking_join_logs
            (booking_id, user_id, event_type, event_source, status, message, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)` ,

        [
            logData.booking_id,
            logData.user_id || null,
            logData.event_type,
            logData.event_source,
            logData.status,
            logData.message || null,
            logData.ip_address || null,
            logData.user_agent || null,
        ]

    );

};

const getBookingJoinLogsByBookingId = async (bookingId, limit = 50) => {

    const [rows] = await db.execute(

        `SELECT
            id,
            booking_id,
            user_id,
            event_type,
            event_source,
            status,
            message,
            ip_address,
            user_agent,
            created_at
         FROM booking_join_logs
         WHERE booking_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,

        [bookingId, Number(limit)]

    );

    return rows;

};





module.exports = {

    createBooking,
    getCircleById,
    getExistingBooking,
    getMyBookings,
    getLatestBookingForUser,
    getAllBookings,
    updateBookingStatus,
    getBookingByIdForAdmin,
    getBookingUser,
    getCircleDetails,
    updateCircleZoomConfig,
    cancelBooking,
    getBookingById,
    getBookingJoinContext,
    setBookingJoinControl,
    createBookingJoinLog,
    getBookingJoinLogsByBookingId
};
   