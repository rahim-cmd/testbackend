const db = require("./db");

const ensureCircleZoomColumns = async (connection) => {
    const requiredColumns = [
        {
            name: "zoom_meeting_id",
            definition: "ADD COLUMN zoom_meeting_id BIGINT NULL AFTER zoom_link",
        },
        {
            name: "zoom_start_url",
            definition: "ADD COLUMN zoom_start_url TEXT NULL AFTER zoom_meeting_id",
        },
        {
            name: "zoom_password",
            definition: "ADD COLUMN zoom_password VARCHAR(50) NULL AFTER zoom_start_url",
        },
        {
            name: "zoom_start_time",
            definition: "ADD COLUMN zoom_start_time DATETIME NULL AFTER zoom_password",
        },
        {
            name: "zoom_duration",
            definition: "ADD COLUMN zoom_duration INT NULL AFTER zoom_start_time",
        },
    ];

    for (const column of requiredColumns) {
        const [rows] = await connection.execute(
            `SHOW COLUMNS FROM circle_events LIKE '${column.name}'`
        );

        if (rows.length === 0) {
            await connection.execute(
                `ALTER TABLE circle_events ${column.definition}`
            );
        }
    }
};

const ensureZoomMeetingIndexes = async (connection) => {
    const [indexes] = await connection.execute(
        "SHOW INDEX FROM zoom_meetings"
    );

    const meetingIdIndex = indexes.find((index) => index.Key_name === "meeting_id");

    if (meetingIdIndex && meetingIdIndex.Non_unique === 0) {
        await connection.execute("ALTER TABLE zoom_meetings DROP INDEX meeting_id");
        await connection.execute("ALTER TABLE zoom_meetings ADD INDEX idx_zoom_meeting_id (meeting_id)");
    }
};

const ensureZoomEventLogTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS zoom_event_logs (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            circle_id INT NULL,
            meeting_id BIGINT NULL,
            event_type VARCHAR(100) NOT NULL,
            event_source VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL,
            message TEXT NULL,
            payload_json LONGTEXT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_zoom_event_logs_circle_id (circle_id),
            INDEX idx_zoom_event_logs_meeting_id (meeting_id),
            INDEX idx_zoom_event_logs_created_at (created_at)
        )`
    );
};

const ensureZoomSchema = async () => {
    const connection = await db.getConnection();

    try {
        await ensureCircleZoomColumns(connection);
        await ensureZoomMeetingIndexes(connection);
        await ensureZoomEventLogTable(connection);
    } finally {
        connection.release();
    }
};

module.exports = ensureZoomSchema;
