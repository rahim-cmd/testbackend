const db = require("../config/db");

const createZoomEventLog = async (connection, logData) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `INSERT INTO zoom_event_logs
         (circle_id, meeting_id, event_type, event_source, status, message, payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            logData.circle_id || null,
            logData.meeting_id || null,
            logData.event_type,
            logData.event_source,
            logData.status,
            logData.message || null,
            logData.payload_json || null,
        ]
    );

    return result.insertId;
};

const getZoomEventLogsByCircleId = async (circleId, limit = 50) => {
    const [rows] = await db.execute(
        `SELECT
            id,
            circle_id,
            meeting_id,
            event_type,
            event_source,
            status,
            message,
            payload_json,
            created_at
         FROM zoom_event_logs
         WHERE circle_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [circleId, Number(limit)]
    );

    return rows;
};

module.exports = {
    createZoomEventLog,
    getZoomEventLogsByCircleId,
};
