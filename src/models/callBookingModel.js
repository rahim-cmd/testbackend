const db = require("../config/db");

const createCallBooking = async (connection, bookingData) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `INSERT INTO call_bookings
            (slot_id, name, email, phone, message)
         VALUES (?, ?, ?, ?, ?)`,
        [
            bookingData.slot_id,
            bookingData.name,
            bookingData.email,
            bookingData.phone || null,
            bookingData.message || null,
        ]
    );

    return result.insertId;
};

const getCallBookingWithSlot = async (bookingId) => {
    const [rows] = await db.execute(
        `SELECT
            cb.id,
            cb.slot_id,
            cb.name,
            cb.email,
            cb.phone,
            cb.message,
            cb.status,
            cb.admin_note,
            cb.created_at,
            s.slot_date,
            s.day_of_week,
            s.start_time,
            s.end_time
         FROM call_bookings cb
         INNER JOIN availability_slots s ON s.id = cb.slot_id
         WHERE cb.id = ?
         LIMIT 1`,
        [bookingId]
    );

    return rows[0];
};

const getAllCallBookings = async ({ status } = {}) => {
    const conditions = [];
    const params = [];

    if (status) {
        conditions.push("cb.status = ?");
        params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.execute(
        `SELECT
            cb.id,
            cb.slot_id,
            cb.name,
            cb.email,
            cb.phone,
            cb.message,
            cb.status,
            cb.admin_note,
            cb.created_at,
            s.slot_date,
            s.day_of_week,
            s.start_time,
            s.end_time
         FROM call_bookings cb
         INNER JOIN availability_slots s ON s.id = cb.slot_id
         ${whereClause}
         ORDER BY s.slot_date ASC, s.start_time ASC`,
        params
    );

    return rows;
};

const updateCallBookingStatus = async (connection, bookingId, status, adminNote) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `UPDATE call_bookings SET status = ?, admin_note = ? WHERE id = ?`,
        [status, adminNote || null, bookingId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    createCallBooking,
    getCallBookingWithSlot,
    getAllCallBookings,
    updateCallBookingStatus,
};
