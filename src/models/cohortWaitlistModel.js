const db = require("../config/db");

const createWaitlistEntry = async (entryData) => {
    const [result] = await db.execute(
        `INSERT INTO cohort_waitlist_entries
            (cohort_id, name, email, phone, message)
         VALUES (?, ?, ?, ?, ?)`,
        [
            entryData.cohort_id || null,
            entryData.name,
            entryData.email,
            entryData.phone || null,
            entryData.message || null,
        ]
    );

    return result.insertId;
};

const getWaitlistEntryById = async (entryId) => {
    const [rows] = await db.execute(
        `SELECT * FROM cohort_waitlist_entries WHERE id = ? LIMIT 1`,
        [entryId]
    );

    return rows[0];
};

const getAllWaitlistEntries = async ({ status, cohortId } = {}) => {
    const conditions = [];
    const params = [];

    if (status) {
        conditions.push("status = ?");
        params.push(status);
    }

    if (cohortId) {
        conditions.push("cohort_id = ?");
        params.push(cohortId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.execute(
        `SELECT * FROM cohort_waitlist_entries
         ${whereClause}
         ORDER BY created_at DESC`,
        params
    );

    return rows;
};

const updateWaitlistEntryStatus = async (connection, entryId, status, adminNote) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `UPDATE cohort_waitlist_entries SET status = ?, admin_note = ? WHERE id = ?`,
        [status, adminNote || null, entryId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    createWaitlistEntry,
    getWaitlistEntryById,
    getAllWaitlistEntries,
    updateWaitlistEntryStatus,
};
