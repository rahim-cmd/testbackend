const db = require("../config/db");

const createSession = async (connection, sessionData) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `INSERT INTO cohort_sessions
            (cohort_id, week_number, theme, session_date, start_time, end_time,
             zoom_meeting_id, zoom_link, zoom_start_url, zoom_password, zoom_start_time, zoom_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            sessionData.cohort_id,
            sessionData.week_number,
            sessionData.theme || null,
            sessionData.session_date,
            sessionData.start_time,
            sessionData.end_time,
            sessionData.zoom_meeting_id || null,
            sessionData.zoom_link || null,
            sessionData.zoom_start_url || null,
            sessionData.zoom_password || null,
            sessionData.zoom_start_time || null,
            sessionData.zoom_duration || null,
        ]
    );

    return result.insertId;
};

const getSessionsByCohortId = async (cohortId) => {
    const [rows] = await db.execute(
        `SELECT * FROM cohort_sessions
         WHERE cohort_id = ?
         ORDER BY week_number ASC`,
        [cohortId]
    );

    return rows;
};

const getSessionById = async (sessionId) => {
    const [rows] = await db.execute(
        `SELECT * FROM cohort_sessions WHERE id = ? LIMIT 1`,
        [sessionId]
    );

    return rows[0];
};

const updateSession = async (connection, sessionId, updates) => {
    const executor = connection || db;
    const fields = Object.keys(updates);

    if (fields.length === 0) {
        return false;
    }

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = [...Object.values(updates), sessionId];

    const [result] = await executor.execute(
        `UPDATE cohort_sessions SET ${setClause} WHERE id = ?`,
        values
    );

    return result.affectedRows > 0;
};

module.exports = {
    createSession,
    getSessionsByCohortId,
    getSessionById,
    updateSession,
};
