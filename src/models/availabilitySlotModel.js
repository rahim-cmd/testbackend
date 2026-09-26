const db = require("../config/db");

const createSlot = async (connection, slotData) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `INSERT IGNORE INTO availability_slots
            (slot_date, day_of_week, start_time, end_time, duration_minutes, created_by_admin_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            slotData.slot_date,
            slotData.day_of_week,
            slotData.start_time,
            slotData.end_time,
            slotData.duration_minutes || 20,
            slotData.created_by_admin_id || null,
        ]
    );

    return result.affectedRows > 0;
};

const getSlotById = async (slotId) => {
    const [rows] = await db.execute(
        `SELECT id, slot_date, day_of_week, start_time, end_time, duration_minutes, status
         FROM availability_slots
         WHERE id = ?
         LIMIT 1`,
        [slotId]
    );

    return rows[0];
};

const getSlotByIdForUpdate = async (connection, slotId) => {
    const [rows] = await connection.execute(
        `SELECT id, slot_date, day_of_week, start_time, end_time, status
         FROM availability_slots
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [slotId]
    );

    return rows[0];
};

const getAvailableSlotsForMonth = async (monthStart, monthEnd) => {
    const [rows] = await db.execute(
        `SELECT id, slot_date, day_of_week, start_time, end_time, duration_minutes
         FROM availability_slots
         WHERE status = 'available'
           AND slot_date BETWEEN ? AND ?
           AND slot_date >= CURDATE()
         ORDER BY slot_date ASC, start_time ASC`,
        [monthStart, monthEnd]
    );

    return rows;
};

const getSlotsForAdmin = async ({ monthStart, monthEnd, status }) => {
    const conditions = [];
    const params = [];

    if (monthStart && monthEnd) {
        conditions.push("s.slot_date BETWEEN ? AND ?");
        params.push(monthStart, monthEnd);
    }

    if (status) {
        conditions.push("s.status = ?");
        params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.execute(
        `SELECT
            s.id,
            s.slot_date,
            s.day_of_week,
            s.start_time,
            s.end_time,
            s.duration_minutes,
            s.status,
            s.created_at,
            cb.id AS booking_id,
            cb.name AS booking_name,
            cb.email AS booking_email,
            cb.phone AS booking_phone,
            cb.status AS booking_status
         FROM availability_slots s
         LEFT JOIN call_bookings cb ON cb.slot_id = s.id
         ${whereClause}
         ORDER BY s.slot_date ASC, s.start_time ASC`,
        params
    );

    return rows;
};

const updateSlotStatus = async (connection, slotId, status) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `UPDATE availability_slots SET status = ? WHERE id = ?`,
        [status, slotId]
    );

    return result.affectedRows > 0;
};

const deleteAvailableSlot = async (slotId) => {
    const [result] = await db.execute(
        `DELETE FROM availability_slots WHERE id = ? AND status = 'available'`,
        [slotId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    createSlot,
    getSlotById,
    getSlotByIdForUpdate,
    getAvailableSlotsForMonth,
    getSlotsForAdmin,
    updateSlotStatus,
    deleteAvailableSlot,
};
