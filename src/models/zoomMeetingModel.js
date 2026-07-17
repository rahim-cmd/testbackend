const db = require("../config/db");

const upsertZoomMeetingForBooking = async (connection, meetingData) => {
    const executor = connection || db;
    const [existingRows] = await executor.execute(
        `SELECT id FROM zoom_meetings WHERE booking_id = ? LIMIT 1`,
        [meetingData.booking_id]
    );

    if (existingRows.length > 0) {
        await executor.execute(
            `UPDATE zoom_meetings
             SET meeting_id = ?, topic = ?, join_url = ?, start_url = ?, password = ?, start_time = ?, duration = ?
             WHERE booking_id = ?`,
            [
                meetingData.meeting_id,
                meetingData.topic,
                meetingData.join_url,
                meetingData.start_url,
                meetingData.password,
                meetingData.start_time,
                meetingData.duration,
                meetingData.booking_id,
            ]
        );

        return existingRows[0].id;
    }

    const [result] = await executor.execute(
        `INSERT INTO zoom_meetings
         (booking_id, meeting_id, topic, join_url, start_url, password, start_time, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            meetingData.booking_id,
            meetingData.meeting_id,
            meetingData.topic,
            meetingData.join_url,
            meetingData.start_url,
            meetingData.password,
            meetingData.start_time,
            meetingData.duration,
        ]
    );

    return result.insertId;
};

const deleteZoomMeetingsByCircleId = async (connection, circleId) => {
    const executor = connection || db;

    await executor.execute(
        `DELETE zm
         FROM zoom_meetings zm
         INNER JOIN bookings b ON b.id = zm.booking_id
         WHERE b.circle_id = ?`,
        [circleId]
    );
};

const deleteZoomMeetingByBookingId = async (connection, bookingId) => {
    const executor = connection || db;

    await executor.execute(
        `DELETE FROM zoom_meetings WHERE booking_id = ?`,
        [bookingId]
    );
};

const getApprovedBookingsForCircle = async (circleId) => {
    const [rows] = await db.execute(
        `SELECT
            b.id AS booking_id,
            b.approved_at,
            u.first_name,
            u.last_name,
            u.email,
            c.title
         FROM bookings b
         INNER JOIN users u ON u.id = b.user_id
         INNER JOIN circle_events c ON c.id = b.circle_id
         WHERE b.circle_id = ?
           AND b.booking_status = 'approved'`,
        [circleId]
    );

    return rows;
};

const getZoomOverviewForCircle = async (circleId) => {
    const [rows] = await db.execute(
        `SELECT
            b.id AS booking_id,
            b.booking_status,
            b.notes,
            b.approved_at,
            u.first_name,
            u.last_name,
            u.email,
            zm.id AS zoom_snapshot_id,
            zm.meeting_id,
            zm.topic,
            zm.join_url,
            zm.start_url,
            zm.password,
            zm.start_time,
            zm.duration,
            zm.updated_at
         FROM bookings b
         INNER JOIN users u ON u.id = b.user_id
         LEFT JOIN zoom_meetings zm ON zm.booking_id = b.id
         WHERE b.circle_id = ?
         ORDER BY b.created_at DESC`,
        [circleId]
    );

    return rows;
};

const getCircleByZoomMeetingId = async (meetingId) => {
    const [rows] = await db.execute(
        `SELECT
            id,
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
         WHERE zoom_meeting_id = ?
         LIMIT 1`,
        [meetingId]
    );

    return rows[0];
};

module.exports = {
    upsertZoomMeetingForBooking,
    deleteZoomMeetingsByCircleId,
    deleteZoomMeetingByBookingId,
    getApprovedBookingsForCircle,
    getZoomOverviewForCircle,
    getCircleByZoomMeetingId,
};
