const db = require("../config/db");

const createMember = async (connection, memberData) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `INSERT INTO cohort_members
            (cohort_id, user_id, status, source, waitlist_entry_id, enrolled_by_admin_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            memberData.cohort_id,
            memberData.user_id,
            memberData.status || "active",
            memberData.source || "manual",
            memberData.waitlist_entry_id || null,
            memberData.enrolled_by_admin_id || null,
        ]
    );

    return result.insertId;
};

const getMemberByCohortAndUser = async (cohortId, userId) => {
    const [rows] = await db.execute(
        `SELECT id, cohort_id, user_id, status
         FROM cohort_members
         WHERE cohort_id = ? AND user_id = ?
         LIMIT 1`,
        [cohortId, userId]
    );

    return rows[0];
};

const getMemberById = async (memberId) => {
    const [rows] = await db.execute(
        `SELECT id, cohort_id, user_id, status, source, waitlist_entry_id, created_at
         FROM cohort_members
         WHERE id = ?
         LIMIT 1`,
        [memberId]
    );

    return rows[0];
};

const getMembersByCohortId = async (cohortId) => {
    const [rows] = await db.execute(
        `SELECT
            cm.id,
            cm.cohort_id,
            cm.user_id,
            cm.status,
            cm.source,
            cm.created_at,
            u.first_name,
            u.last_name,
            u.email,
            COALESCE(cjc.is_enabled, 1) AS join_enabled,
            cjc.lock_reason AS join_lock_reason
         FROM cohort_members cm
         INNER JOIN users u ON u.id = cm.user_id
         LEFT JOIN cohort_join_controls cjc ON cjc.cohort_member_id = cm.id
         WHERE cm.cohort_id = ?
         ORDER BY cm.created_at ASC`,
        [cohortId]
    );

    return rows;
};

const getActiveMembershipForUser = async (userId) => {
    const [rows] = await db.execute(
        `SELECT
            cm.id,
            cm.cohort_id,
            cm.user_id,
            cm.status,
            cm.created_at,
            COALESCE(cjc.is_enabled, 1) AS join_enabled,
            cjc.lock_reason AS join_lock_reason,
            cjc.locked_at AS join_locked_at
         FROM cohort_members cm
         LEFT JOIN cohort_join_controls cjc ON cjc.cohort_member_id = cm.id
         WHERE cm.user_id = ?
           AND cm.status = 'active'
         ORDER BY cm.created_at DESC
         LIMIT 1`,
        [userId]
    );

    return rows[0];
};

const updateMemberStatus = async (connection, memberId, status) => {
    const executor = connection || db;

    const [result] = await executor.execute(
        `UPDATE cohort_members SET status = ? WHERE id = ?`,
        [status, memberId]
    );

    return result.affectedRows > 0;
};

const setMemberJoinControl = async (connection, memberId, controlData) => {
    const executor = connection || db;

    await executor.execute(
        `INSERT INTO cohort_join_controls
            (cohort_member_id, is_enabled, locked_by_admin_id, lock_reason, locked_at, enabled_at, disabled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            is_enabled = VALUES(is_enabled),
            locked_by_admin_id = VALUES(locked_by_admin_id),
            lock_reason = VALUES(lock_reason),
            locked_at = VALUES(locked_at),
            enabled_at = VALUES(enabled_at),
            disabled_at = VALUES(disabled_at)`,
        [
            memberId,
            controlData.is_enabled ? 1 : 0,
            controlData.locked_by_admin_id || null,
            controlData.lock_reason || null,
            controlData.locked_at || null,
            controlData.enabled_at || null,
            controlData.disabled_at || null,
        ]
    );
};

const createMemberJoinLog = async (connection, logData) => {
    const executor = connection || db;

    await executor.execute(
        `INSERT INTO cohort_join_logs
            (cohort_member_id, cohort_session_id, user_id, event_type, event_source, status, message, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            logData.cohort_member_id,
            logData.cohort_session_id || null,
            logData.user_id || null,
            logData.event_type,
            logData.event_source,
            logData.status,
            logData.message || null,
            logData.ip_address || null,
            logData.user_agent || null,
        ]
    );
};

const getMemberJoinLogs = async (memberId, limit = 50) => {
    const [rows] = await db.execute(
        `SELECT
            id, cohort_member_id, cohort_session_id, user_id,
            event_type, event_source, status, message, ip_address, user_agent, created_at
         FROM cohort_join_logs
         WHERE cohort_member_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [memberId, Number(limit)]
    );

    return rows;
};

module.exports = {
    createMember,
    getMemberByCohortAndUser,
    getMemberById,
    getMembersByCohortId,
    getActiveMembershipForUser,
    updateMemberStatus,
    setMemberJoinControl,
    createMemberJoinLog,
    getMemberJoinLogs,
};
