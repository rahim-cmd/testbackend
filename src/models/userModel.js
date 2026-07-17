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

const getAllUsers = async () => {
  const [rows] = await db.execute(
    `SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      role,
      status,
      email_verified,
      created_at
    FROM users
    ORDER BY created_at DESC`
  );

  return rows;
};

const findUserByEmailExcludingId = async (email, id) => {
  const [rows] = await db.execute(
    "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
    [email, id]
  );

  return rows[0];
};

const updateUserById = async (id, userData) => {
  const fields = Object.keys(userData);

  if (fields.length === 0) {
    return false;
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = [...Object.values(userData), id];

  const [result] = await db.execute(
    `UPDATE users SET ${setClause} WHERE id = ?`,
    values
  );

  return result.affectedRows > 0;
};

const deleteUserById = async (id) => {
  const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);

  return result.affectedRows > 0;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getAllUsers,
  findUserByEmailExcludingId,
  updateUserById,
  deleteUserById,
};