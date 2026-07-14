const db = require("../config/db");

const findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0];
};

const findUserById = async (id) => {
  const [rows] = await db.execute(
    "SELECT id, first_name, last_name, email, phone, role, status, email_verified, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );

  return rows[0];
};

const createUser = async (user) => {
  const [result] = await db.execute(
    `INSERT INTO users
    (
        first_name,
        last_name,
        email,
        phone,
        password,
        role,
        status,
        email_verified
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.first_name,
      user.last_name,
      user.email,
      user.phone,
      user.password,
      user.role,
      user.status,
      user.email_verified,
    ]
  );

  return result.insertId;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};