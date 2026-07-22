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

const ensureBookingJoinControlTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS booking_join_controls (
            booking_id INT NOT NULL,
            is_enabled TINYINT(1) NOT NULL DEFAULT 1,
            locked_by_user_id INT NULL,
            locked_by_admin_id INT NULL,
            lock_reason TEXT NULL,
            locked_at DATETIME NULL,
            enabled_at DATETIME NULL,
            disabled_at DATETIME NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (booking_id),
            INDEX idx_booking_join_controls_enabled (is_enabled),
            INDEX idx_booking_join_controls_locked_by_user_id (locked_by_user_id),
            INDEX idx_booking_join_controls_locked_by_admin_id (locked_by_admin_id)
        )`
    );
};

const ensureBookingJoinLogTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS booking_join_logs (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            booking_id INT NOT NULL,
            user_id INT NULL,
            event_type VARCHAR(50) NOT NULL,
            event_source VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            message TEXT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_booking_join_logs_booking_id (booking_id),
            INDEX idx_booking_join_logs_user_id (user_id),
            INDEX idx_booking_join_logs_created_at (created_at)
        )`
    );
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

const ensureBookingReviewTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS booking_reviews (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            booking_id INT NOT NULL,
            circle_id INT NOT NULL,
            user_id INT NOT NULL,
            rating TINYINT UNSIGNED NOT NULL,
            review_text TEXT NULL,
            is_public TINYINT(1) NOT NULL DEFAULT 1,
            review_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
            moderated_by_admin_id INT NULL,
            moderated_at DATETIME NULL,
            moderation_note TEXT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_booking_reviews_booking_user (booking_id, user_id),
            INDEX idx_booking_reviews_circle_id (circle_id),
            INDEX idx_booking_reviews_user_id (user_id),
            INDEX idx_booking_reviews_status (review_status),
            INDEX idx_booking_reviews_public_created (is_public, created_at)
        )`
    );

    const requiredColumns = [
        {
            name: "review_status",
            definition: "ADD COLUMN review_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER is_public",
        },
        {
            name: "moderated_by_admin_id",
            definition: "ADD COLUMN moderated_by_admin_id INT NULL AFTER review_status",
        },
        {
            name: "moderated_at",
            definition: "ADD COLUMN moderated_at DATETIME NULL AFTER moderated_by_admin_id",
        },
        {
            name: "moderation_note",
            definition: "ADD COLUMN moderation_note TEXT NULL AFTER moderated_at",
        },
    ];

    for (const column of requiredColumns) {
        const [rows] = await connection.execute(
            `SHOW COLUMNS FROM booking_reviews LIKE '${column.name}'`
        );

        if (rows.length === 0) {
            await connection.execute(`ALTER TABLE booking_reviews ${column.definition}`);
        }
    }

    const [indexes] = await connection.execute("SHOW INDEX FROM booking_reviews");
    const hasStatusIndex = indexes.some((index) => index.Key_name === "idx_booking_reviews_status");

    if (!hasStatusIndex) {
        await connection.execute(
            "ALTER TABLE booking_reviews ADD INDEX idx_booking_reviews_status (review_status)"
        );
    }
};

const ensureZoomSchema = async () => {
    const connection = await db.getConnection();

    try {
        await ensureCircleZoomColumns(connection);
        await ensureZoomMeetingIndexes(connection);
        await ensureZoomEventLogTable(connection);
        await ensureBookingJoinControlTable(connection);
        await ensureBookingJoinLogTable(connection);
        await ensureBookingReviewTable(connection);
    } finally {
        connection.release();
    }
};

module.exports = ensureZoomSchema;
