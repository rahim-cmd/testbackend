require("dotenv").config();
const mysql = require("mysql2/promise");

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    await conn.query(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INT NOT NULL AUTO_INCREMENT,
            user_id INT NOT NULL,
            circle_id INT NOT NULL,
            payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
            booking_status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
            notes TEXT NULL,
            approved_by INT NULL,
            approved_at DATETIME NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_bookings_user_id (user_id),
            KEY idx_bookings_circle_id (circle_id),
            KEY idx_bookings_approved_by (approved_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows] = await conn.query("DESCRIBE bookings");
    console.log("bookings_restored_columns:", rows.map((row) => row.Field).join(", "));

    await conn.end();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
