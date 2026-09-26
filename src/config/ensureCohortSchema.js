const db = require("./db");

const DEFAULT_FEATURES = [
    "Weekly 90-minute Zoom sessions",
    "Maximum 6 women per cohort",
    "A different theme/topic explored each week",
    "Guided deep journaling and self-reflection",
    "Sharing circle and meaningful group discussion",
    "Guided reflection questions and journal prompts",
    "Gentle meditation/grounding practices",
    "A PDF workbook covering the 7 weeks",
    "Reflection prompts to use between sessions",
    "A supportive space to pause, reflect, connect and reset",
];

const ensureCohortsTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS cohorts (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(200) NOT NULL DEFAULT '7-Week Journaling & Self-Reflection Cohort',
            description TEXT NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 175.00,
            currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
            duration_weeks INT NOT NULL DEFAULT 7,
            session_duration_minutes INT NOT NULL DEFAULT 90,
            max_members INT NOT NULL DEFAULT 6,
            seats_taken INT NOT NULL DEFAULT 0,
            start_date DATE NULL,
            session_day VARCHAR(20) NULL,
            session_time TIME NULL,
            workbook_url VARCHAR(500) NULL,
            features_json LONGTEXT NULL,
            status ENUM('draft', 'open', 'full', 'closed') NOT NULL DEFAULT 'open',
            created_by_admin_id INT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_cohorts_status (status)
        )`
    );
};

const ensureCohortWaitlistTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS cohort_waitlist_entries (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            cohort_id INT UNSIGNED NULL,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(30) NULL,
            message TEXT NULL,
            status ENUM('pending', 'contacted', 'converted', 'cancelled') NOT NULL DEFAULT 'pending',
            admin_note TEXT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_cohort_waitlist_cohort_id (cohort_id),
            INDEX idx_cohort_waitlist_status (status),
            INDEX idx_cohort_waitlist_email (email),
            CONSTRAINT fk_cohort_waitlist_cohort FOREIGN KEY (cohort_id)
                REFERENCES cohorts (id) ON DELETE SET NULL
        )`
    );
};

const ensureDefaultCohort = async (connection) => {
    const [rows] = await connection.execute(`SELECT id FROM cohorts LIMIT 1`);

    if (rows.length > 0) {
        return;
    }

    await connection.execute(
        `INSERT INTO cohorts
            (title, description, price, currency, duration_weeks, session_duration_minutes, max_members, seats_taken, features_json, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            "7-Week Journaling & Self-Reflection Cohort",
            "A small-group, guided container to pause, reflect, connect and reset.",
            175.00,
            "GBP",
            7,
            90,
            6,
            0,
            JSON.stringify(DEFAULT_FEATURES),
            "open",
        ]
    );
};

const ensureCohortMembersTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS cohort_members (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            cohort_id INT UNSIGNED NOT NULL,
            user_id INT NOT NULL,
            status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
            source ENUM('manual', 'waitlist') NOT NULL DEFAULT 'manual',
            waitlist_entry_id INT UNSIGNED NULL,
            enrolled_by_admin_id INT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_cohort_members_cohort_user (cohort_id, user_id),
            INDEX idx_cohort_members_user_id (user_id),
            INDEX idx_cohort_members_status (status),
            CONSTRAINT fk_cohort_members_cohort FOREIGN KEY (cohort_id)
                REFERENCES cohorts (id) ON DELETE CASCADE
        )`
    );
};

const ensureCohortSessionsTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS cohort_sessions (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            cohort_id INT UNSIGNED NOT NULL,
            week_number INT NOT NULL,
            theme VARCHAR(255) NULL,
            session_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            zoom_meeting_id BIGINT NULL,
            zoom_link TEXT NULL,
            zoom_start_url TEXT NULL,
            zoom_password VARCHAR(50) NULL,
            zoom_start_time DATETIME NULL,
            zoom_duration INT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_cohort_sessions_cohort_week (cohort_id, week_number),
            INDEX idx_cohort_sessions_date (session_date),
            CONSTRAINT fk_cohort_sessions_cohort FOREIGN KEY (cohort_id)
                REFERENCES cohorts (id) ON DELETE CASCADE
        )`
    );
};

const ensureCohortJoinControlsTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS cohort_join_controls (
            cohort_member_id INT UNSIGNED NOT NULL,
            is_enabled TINYINT(1) NOT NULL DEFAULT 1,
            locked_by_admin_id INT NULL,
            lock_reason TEXT NULL,
            locked_at DATETIME NULL,
            enabled_at DATETIME NULL,
            disabled_at DATETIME NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (cohort_member_id),
            CONSTRAINT fk_cohort_join_controls_member FOREIGN KEY (cohort_member_id)
                REFERENCES cohort_members (id) ON DELETE CASCADE
        )`
    );
};

const ensureCohortJoinLogsTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS cohort_join_logs (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            cohort_member_id INT UNSIGNED NOT NULL,
            cohort_session_id INT UNSIGNED NULL,
            user_id INT NULL,
            event_type VARCHAR(50) NOT NULL,
            event_source VARCHAR(20) NOT NULL,
            status VARCHAR(20) NOT NULL,
            message TEXT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_cohort_join_logs_member_id (cohort_member_id),
            INDEX idx_cohort_join_logs_session_id (cohort_session_id),
            INDEX idx_cohort_join_logs_created_at (created_at),
            CONSTRAINT fk_cohort_join_logs_member FOREIGN KEY (cohort_member_id)
                REFERENCES cohort_members (id) ON DELETE CASCADE
        )`
    );
};

// Separate from booking_reviews (circle reviews) on purpose — cohort reviews are
// keyed by cohort_id, not circle_id, and booking_reviews is left untouched.
const ensureCohortReviewsTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS cohort_reviews (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            cohort_id INT UNSIGNED NOT NULL,
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
            UNIQUE KEY uk_cohort_reviews_cohort_user (cohort_id, user_id),
            INDEX idx_cohort_reviews_status (review_status),
            CONSTRAINT fk_cohort_reviews_cohort FOREIGN KEY (cohort_id)
                REFERENCES cohorts (id) ON DELETE CASCADE
        )`
    );
};

const ensureCohortSchema = async () => {
    const connection = await db.getConnection();

    try {
        await ensureCohortsTable(connection);
        await ensureCohortWaitlistTable(connection);
        await ensureDefaultCohort(connection);
        await ensureCohortMembersTable(connection);
        await ensureCohortSessionsTable(connection);
        await ensureCohortJoinControlsTable(connection);
        await ensureCohortJoinLogsTable(connection);
        await ensureCohortReviewsTable(connection);
    } finally {
        connection.release();
    }
};

module.exports = ensureCohortSchema;
