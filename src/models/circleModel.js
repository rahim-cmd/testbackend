const db = require("../config/db");

const bookedMembersJoin = `
  LEFT JOIN (
    SELECT circle_id, COUNT(*) AS booked_members
    FROM bookings
    WHERE booking_status = 'approved'
    GROUP BY circle_id
  ) booking_counts ON booking_counts.circle_id = circle_events.id
`;

const createCircle = async (circle) => {
  const [result] = await db.execute(
    `INSERT INTO circle_events
        (
            title,
            description,
            meeting_date,
            start_time,
            end_time,
            max_members,
            booked_members,
            zoom_link,
          zoom_meeting_id,
          zoom_start_url,
          zoom_password,
          zoom_start_time,
          zoom_duration,
            host_name,
            booking_open,
            status,
            created_by
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

    [
      circle.title,
      circle.description,
      circle.meeting_date,
      circle.start_time,
      circle.end_time,
      circle.max_members,
      0,
      circle.zoom_link,
      circle.zoom_meeting_id,
      circle.zoom_start_url,
      circle.zoom_password,
      circle.zoom_start_time,
      circle.zoom_duration,
      circle.host_name,
      1,
      "scheduled",
      circle.created_by,
    ],
  );

  return result.insertId;
};

const getUpcomingCircles = async () => {
  const [rows] = await db.execute(
    `SELECT
            id,
            title,
            description,
            meeting_date,
            start_time,
            end_time,
            max_members,
            COALESCE(booking_counts.booked_members, 0) AS booked_members,
            zoom_link,
            zoom_meeting_id,
            zoom_start_time,
            zoom_duration,
            host_name
        FROM circle_events
          ${bookedMembersJoin}
        WHERE
            status = 'scheduled'
            AND booking_open = 1
            AND meeting_date >= CURDATE()
        ORDER BY meeting_date ASC, start_time ASC`,
  );

  return rows;
};

const getAllCircles = async () => {
  const [rows] = await db.execute(
    `SELECT
            id,
            title,
            description,
            meeting_date,
            start_time,
            end_time,
            max_members,
            COALESCE(booking_counts.booked_members, 0) AS booked_members,
            zoom_link,
            zoom_meeting_id,
            zoom_start_url,
            zoom_password,
            zoom_start_time,
            zoom_duration,
            host_name,
            booking_open,
            status,
            created_by,
            created_at
        FROM circle_events
          ${bookedMembersJoin}
        ORDER BY meeting_date DESC, start_time DESC`,
  );

  return rows;
};

const getCircleById = async (id) => {
  const [rows] = await db.execute(
    `SELECT
            id,
            title,
            description,
            meeting_date,
            start_time,
            end_time,
            max_members,
            COALESCE(booking_counts.booked_members, 0) AS booked_members,
            zoom_link,
            zoom_meeting_id,
            zoom_start_url,
            zoom_password,
            zoom_start_time,
            zoom_duration,
            host_name,
            booking_open,
            status,
            created_by,
            created_at
        FROM circle_events
          ${bookedMembersJoin}
        WHERE id = ?
        LIMIT 1`,
    [id],
  );

  return rows[0];
};

const updateCircle = async (id, userId, circleData) => {
  const fields = Object.keys(circleData);

  if (fields.length === 0) {
    return false;
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = [...Object.values(circleData), id, userId];

  const [result] = await db.execute(
    `UPDATE circle_events SET ${setClause} WHERE id = ? AND created_by = ?`,
    values,
  );

  return result.affectedRows > 0;
};

const deleteCircle = async (id, userId) => {
  const [result] = await db.execute(
    `DELETE FROM circle_events WHERE id = ? AND created_by = ?`,
    [id, userId],
  );

  return result.affectedRows > 0;
};

const updateCircleById = async (id, circleData) => {
  const fields = Object.keys(circleData);

  if (fields.length === 0) {
    return false;
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = [...Object.values(circleData), id];

  const [result] = await db.execute(
    `UPDATE circle_events SET ${setClause} WHERE id = ?`,
    values,
  );

  return result.affectedRows > 0;
};

const updateCircleByIdWithConnection = async (connection, id, circleData) => {
  const fields = Object.keys(circleData);

  if (fields.length === 0) {
    return false;
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const values = [...Object.values(circleData), id];

  const [result] = await connection.execute(
    `UPDATE circle_events SET ${setClause} WHERE id = ?`,
    values,
  );

  return result.affectedRows > 0;
};

const deleteCircleById = async (id) => {
  const [result] = await db.execute(`DELETE FROM circle_events WHERE id = ?`, [id]);

  return result.affectedRows > 0;
};

const deleteCircleWithConnection = async (connection, id, userId) => {
  const [result] = await connection.execute(
    `DELETE FROM circle_events WHERE id = ? AND created_by = ?`,
    [id, userId],
  );

  return result.affectedRows > 0;
};

const deleteCircleByIdWithConnection = async (connection, id) => {
  const [result] = await connection.execute(`DELETE FROM circle_events WHERE id = ?`, [id]);

  return result.affectedRows > 0;
};

module.exports = {
  createCircle,
  getUpcomingCircles,
  getAllCircles,
  getCircleById,
  updateCircle,
  deleteCircle,
  deleteCircleWithConnection,
  updateCircleById,
  updateCircleByIdWithConnection,
  deleteCircleById,
  deleteCircleByIdWithConnection,
};
