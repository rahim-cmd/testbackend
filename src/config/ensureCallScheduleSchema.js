const db = require("./db");

const ensureAvailabilitySlotsTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS availability_slots (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            slot_date DATE NOT NULL,
            day_of_week VARCHAR(10) NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            duration_minutes INT NOT NULL DEFAULT 20,
            status ENUM('available', 'booked', 'cancelled') NOT NULL DEFAULT 'available',
            created_by_admin_id INT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_availability_slot_date_time (slot_date, start_time),
            INDEX idx_availability_slots_date (slot_date),
            INDEX idx_availability_slots_status (status)
        )`
    );
};

const ensureCallBookingsTable = async (connection) => {
    await connection.execute(
        `CREATE TABLE IF NOT EXISTS call_bookings (
            id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            slot_id INT UNSIGNED NOT NULL,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(30) NULL,
            message TEXT NULL,
            status ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
            admin_note TEXT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_call_bookings_slot_id (slot_id),
            INDEX idx_call_bookings_status (status),
            INDEX idx_call_bookings_email (email),
            CONSTRAINT fk_call_bookings_slot FOREIGN KEY (slot_id)
                REFERENCES availability_slots (id) ON DELETE CASCADE
        )`
    );
};

const ensureCallScheduleSchema = async () => {
    const connection = await db.getConnection();

    try {
        await ensureAvailabilitySlotsTable(connection);
        await ensureCallBookingsTable(connection);
    } finally {
        connection.release();
    }
};

module.exports = ensureCallScheduleSchema;
