const db = require("../config/db");

const createCohort = async (cohortData) => {
    const [result] = await db.execute(
        `INSERT INTO cohorts
            (title, description, price, currency, duration_weeks, session_duration_minutes, max_members, seats_taken, start_date, session_day, session_time, workbook_url, features_json, status, created_by_admin_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            cohortData.title,
            cohortData.description,
            cohortData.price,
            cohortData.currency,
            cohortData.duration_weeks,
            cohortData.session_duration_minutes,
            cohortData.max_members,
            cohortData.seats_taken || 0,
            cohortData.start_date || null,
            cohortData.session_day || null,
            cohortData.session_time || null,
            cohortData.workbook_url || null,
            cohortData.features_json,
            cohortData.status || "open",
            cohortData.created_by_admin_id || null,
        ]
    );

    return result.insertId;
};

const getCurrentCohort = async () => {
    const [rows] = await db.execute(
        `SELECT * FROM cohorts
         WHERE status IN ('open', 'full')
         ORDER BY created_at DESC
         LIMIT 1`
    );

    return rows[0];
};

const getCohortById = async (cohortId) => {
    const [rows] = await db.execute(
        `SELECT * FROM cohorts WHERE id = ? LIMIT 1`,
        [cohortId]
    );

    return rows[0];
};

const getAllCohorts = async () => {
    const [rows] = await db.execute(
        `SELECT * FROM cohorts ORDER BY created_at DESC`
    );

    return rows;
};

const updateCohort = async (cohortId, updates) => {
    const fields = Object.keys(updates);

    if (fields.length === 0) {
        return false;
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = [...Object.values(updates), cohortId];

    const [result] = await db.execute(
        `UPDATE cohorts SET ${setClause} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};

const deleteCohort = async (cohortId) => {
    const [result] = await db.execute(
        `DELETE FROM cohorts WHERE id = ?`,
        [cohortId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    createCohort,
    getCurrentCohort,
    getCohortById,
    getAllCohorts,
    updateCohort,
    deleteCohort,
};
