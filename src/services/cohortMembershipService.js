const db = require("../config/db");
const cohortModel = require("../models/cohortModel");
const cohortMemberModel = require("../models/cohortMemberModel");
const cohortSessionModel = require("../models/cohortSessionModel");
const cohortWaitlistModel = require("../models/cohortWaitlistModel");
const userModel = require("../models/userModel");
const {
    sendCohortEnrollmentEmail,
    sendDirectZoomLinkEmail,
} = require("./emailService");

const formatDateValue = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        return value.length >= 10 ? value.slice(0, 10) : value;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    return value;
};

const formatTimeValue = (value) => (typeof value === "string" ? value.slice(0, 5) : value);

const resolveUser = async ({ userId, email }) => {
    if (userId) {
        const user = await userModel.findUserById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        return user;
    }

    if (email) {
        const user = await userModel.findUserByEmail(email);

        if (!user) {
            throw new Error("No registered user found with this email.");
        }

        return user;
    }

    throw new Error("Either user_id or email is required to allot a member.");
};

const allotUserToCohort = async ({ cohortId, userId, email, waitlistEntryId, adminId }) => {
    const cohort = await cohortModel.getCohortById(cohortId);

    if (!cohort) {
        throw new Error("Cohort not found.");
    }

    if (cohort.seats_taken >= cohort.max_members) {
        throw new Error("This cohort is already full.");
    }

    const user = await resolveUser({ userId, email });

    const existingMembership = await cohortMemberModel.getMemberByCohortAndUser(cohortId, user.id);

    if (existingMembership && existingMembership.status === "active") {
        throw new Error("This user is already an active member of this cohort.");
    }

    const connection = await db.getConnection();
    let memberId;

    try {
        await connection.beginTransaction();

        memberId = await cohortMemberModel.createMember(connection, {
            cohort_id: cohortId,
            user_id: user.id,
            status: "active",
            source: waitlistEntryId ? "waitlist" : "manual",
            waitlist_entry_id: waitlistEntryId || null,
            enrolled_by_admin_id: adminId,
        });

        const newSeatsTaken = cohort.seats_taken + 1;
        const newStatus = newSeatsTaken >= cohort.max_members ? "full" : cohort.status;

        await cohortModel.updateCohort(cohortId, {
            seats_taken: newSeatsTaken,
            status: newStatus,
        });

        if (waitlistEntryId) {
            await cohortWaitlistModel.updateWaitlistEntryStatus(connection, waitlistEntryId, "converted", "Allotted to cohort.");
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    try {
        await sendCohortEnrollmentEmail({
            to: user.email,
            userName: `${user.first_name} ${user.last_name || ""}`.trim(),
            cohortTitle: cohort.title,
        });
    } catch (error) {
        console.warn("Cohort enrollment email failed:", error.message);
    }

    return { id: memberId, cohort_id: cohortId, user_id: user.id };
};

const getCohortMembers = async (cohortId) => {
    return await cohortMemberModel.getMembersByCohortId(cohortId);
};

const updateMemberStatus = async ({ memberId, status, adminId }) => {
    const member = await cohortMemberModel.getMemberById(memberId);

    if (!member) {
        throw new Error("Cohort member not found.");
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await cohortMemberModel.updateMemberStatus(connection, memberId, status);

        if (status === "cancelled" && member.status === "active") {
            const cohort = await cohortModel.getCohortById(member.cohort_id);

            if (cohort) {
                const newSeatsTaken = Math.max(cohort.seats_taken - 1, 0);
                const newStatus = cohort.status === "full" ? "open" : cohort.status;

                await cohortModel.updateCohort(member.cohort_id, {
                    seats_taken: newSeatsTaken,
                    status: newStatus,
                });
            }
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }

    return { id: memberId, status };
};

const setMemberJoinControl = async ({ memberId, isEnabled, adminId, reason }) => {
    const member = await cohortMemberModel.getMemberById(memberId);

    if (!member) {
        throw new Error("Cohort member not found.");
    }

    await cohortMemberModel.setMemberJoinControl(null, memberId, {
        is_enabled: Boolean(isEnabled),
        locked_by_admin_id: adminId,
        lock_reason: reason || null,
        locked_at: isEnabled ? null : new Date(),
        enabled_at: isEnabled ? new Date() : null,
        disabled_at: isEnabled ? null : new Date(),
    });

    return { id: memberId, join_enabled: Boolean(isEnabled) };
};

const presentSessionForMember = (session, joinEnabled, memberStatus) => {
    const canJoin = memberStatus === "active" && joinEnabled && Boolean(session.zoom_link);

    return {
        id: session.id,
        week_number: session.week_number,
        theme: session.theme,
        session_date: formatDateValue(session.session_date),
        start_time: formatTimeValue(session.start_time),
        end_time: formatTimeValue(session.end_time),
        can_join: canJoin,
        zoom_link: canJoin ? session.zoom_link : null,
        zoom_password: canJoin ? session.zoom_password : null,
        join_message: memberStatus !== "active"
            ? "Your cohort membership is not active."
            : !joinEnabled
                ? "Join access is currently disabled by admin."
                : !session.zoom_link
                    ? "Meeting link is not available yet."
                    : "You can join this session from your dashboard.",
    };
};

const getMyCohort = async (userId) => {
    const membership = await cohortMemberModel.getActiveMembershipForUser(userId);

    if (!membership) {
        return null;
    }

    const cohort = await cohortModel.getCohortById(membership.cohort_id);
    const sessions = await cohortSessionModel.getSessionsByCohortId(membership.cohort_id);
    const joinEnabled = Boolean(Number(membership.join_enabled ?? 1));

    return {
        member_id: membership.id,
        status: membership.status,
        join_enabled: joinEnabled,
        join_lock_reason: membership.join_lock_reason || null,
        cohort: cohort ? {
            id: cohort.id,
            title: cohort.title,
            description: cohort.description,
            start_date: formatDateValue(cohort.start_date),
        } : null,
        sessions: sessions.map((session) => presentSessionForMember(session, joinEnabled, membership.status)),
    };
};

const startSessionJoin = async ({ memberId, sessionId, userId, ipAddress, userAgent }) => {
    const membership = await cohortMemberModel.getMemberById(memberId);

    if (!membership || membership.user_id !== userId) {
        throw new Error("Cohort membership not found.");
    }

    if (membership.status !== "active") {
        throw new Error("Your cohort membership is not active.");
    }

    await cohortMemberModel.createMemberJoinLog(null, {
        cohort_member_id: memberId,
        cohort_session_id: sessionId,
        user_id: userId,
        event_type: "join_started",
        event_source: "user",
        status: "success",
        message: "User opened the session from the dashboard.",
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
    });

    return { member_id: memberId, session_id: sessionId };
};

const endSessionJoin = async ({ memberId, sessionId, userId, ipAddress, userAgent }) => {
    const membership = await cohortMemberModel.getMemberById(memberId);

    if (!membership || membership.user_id !== userId) {
        throw new Error("Cohort membership not found.");
    }

    await cohortMemberModel.createMemberJoinLog(null, {
        cohort_member_id: memberId,
        cohort_session_id: sessionId,
        user_id: userId,
        event_type: "join_ended",
        event_source: "user",
        status: "success",
        message: "User ended the dashboard session view.",
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
    });

    return { member_id: memberId, session_id: sessionId };
};

const getMemberJoinLogs = async (memberId) => {
    return await cohortMemberModel.getMemberJoinLogs(memberId);
};

const sendDirectSessionLink = async ({ sessionId, memberId, adminId, adminNote }) => {
    const session = await cohortSessionModel.getSessionById(sessionId);

    if (!session) {
        throw new Error("Session not found.");
    }

    if (!session.zoom_link) {
        throw new Error("This session does not have a Zoom link configured yet.");
    }

    const member = await cohortMemberModel.getMemberById(memberId);

    if (!member || member.cohort_id !== session.cohort_id) {
        throw new Error("This member does not belong to this session's cohort.");
    }

    const user = await userModel.findUserById(member.user_id);

    if (!user) {
        throw new Error("User not found.");
    }

    await sendDirectZoomLinkEmail({
        to: user.email,
        userName: `${user.first_name} ${user.last_name || ""}`.trim(),
        sessionLabel: `Week ${session.week_number}${session.theme ? ` — ${session.theme}` : ""}`,
        zoomLink: session.zoom_link,
        zoomPassword: session.zoom_password,
        adminNote,
    });

    await cohortMemberModel.createMemberJoinLog(null, {
        cohort_member_id: memberId,
        cohort_session_id: sessionId,
        user_id: user.id,
        event_type: "link_shared_by_admin",
        event_source: "admin",
        status: "success",
        message: adminNote || "Admin shared the Zoom link directly with this member.",
    });

    return { member_id: memberId, session_id: sessionId, sent: true };
};

module.exports = {
    allotUserToCohort,
    getCohortMembers,
    updateMemberStatus,
    setMemberJoinControl,
    getMyCohort,
    startSessionJoin,
    endSessionJoin,
    getMemberJoinLogs,
    sendDirectSessionLink,
};
