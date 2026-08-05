const db = require("../config/db");

const createResetToken = async ({
  userId,
  tokenHash,
  otpHash,
  expiresAt,
}) => {
  const [result] = await db.execute(
    `INSERT INTO password_reset_tokens
      (user_id, token_hash, otp_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, otpHash, expiresAt]
  );

  return result.insertId;
};

const findValidResetTokenByHash = async (tokenHash) => {
  const [rows] = await db.execute(
    `SELECT id, user_id, token_hash, otp_hash, expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [tokenHash]
  );

  return rows[0];
};

const markTokenAsUsed = async (id) => {
  const [result] = await db.execute(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = ? AND used_at IS NULL`,
    [id]
  );

  return result.affectedRows > 0;
};

const revokeActiveResetTokensForUser = async (userId) => {
  await db.execute(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = ? AND used_at IS NULL`,
    [userId]
  );
};

module.exports = {
  createResetToken,
  findValidResetTokenByHash,
  markTokenAsUsed,
  revokeActiveResetTokensForUser,
};
