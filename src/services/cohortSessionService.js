const cohortModel = require("../models/cohortModel");
const cohortSessionModel = require("../models/cohortSessionModel");
const { createZoomMeeting, updateZoomMeeting } = require("./zoomService");

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

const presentSession = (session) => ({
    ...session,
    session_date: formatDateValue(session.session_date),
    start_time: formatTimeValue(session.start_time),
    end_time: formatTimeValue(session.end_time),
});

const createSessionsForCohort = async ({ cohortId, sessions }) => {
    const cohort = await cohortModel.getCohortById(cohortId);

    if (!cohort) {
        throw new Error("Cohort not found.");
    }

    if (!Array.isArray(sessions) || sessions.length === 0) {
        throw new Error("At least one session is required.");
    }

    const created = [];

    for (const sessionInput of sessions) {
        let zoomMeeting = null;

        if (!sessionInput.zoom_link) {
            zoomMeeting = await createZoomMeeting({
                title: `${cohort.title} — Week ${sessionInput.week_number}`,
                description: sessionInput.theme || cohort.description,
                meeting_date: sessionInput.session_date,
                start_time: sessionInput.start_time,
                end_time: sessionInput.end_time,
            });
        }

        const sessionId = await cohortSessionModel.createSession(null, {
            cohort_id: cohortId,
            week_number: sessionInput.week_number,
            theme: sessionInput.theme || null,
            session_date: sessionInput.session_date,
            start_time: sessionInput.start_time,
            end_time: sessionInput.end_time,
            zoom_meeting_id: zoomMeeting ? zoomMeeting.meeting_id : null,
            zoom_link: zoomMeeting ? zoomMeeting.join_url : sessionInput.zoom_link || null,
            zoom_start_url: zoomMeeting ? zoomMeeting.start_url : null,
            zoom_password: zoomMeeting ? zoomMeeting.password : null,
            zoom_start_time: zoomMeeting ? zoomMeeting.start_time : null,
            zoom_duration: zoomMeeting ? zoomMeeting.duration : null,
        });

        const session = await cohortSessionModel.getSessionById(sessionId);
        created.push(presentSession(session));
    }

    return created;
};

const getSessionsByCohortId = async (cohortId) => {
    const sessions = await cohortSessionModel.getSessionsByCohortId(cohortId);

    return sessions.map(presentSession);
};

const updateSession = async (sessionId, updates) => {
    const existingSession = await cohortSessionModel.getSessionById(sessionId);

    if (!existingSession) {
        throw new Error("Session not found.");
    }

    const allowedFields = ["theme", "session_date", "start_time", "end_time", "zoom_link", "zoom_password"];
    const payload = {};

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            payload[field] = updates[field];
        }
    }

    const shouldSyncZoom = Boolean(existingSession.zoom_meeting_id) && ["session_date", "start_time", "end_time"].some(
        (field) => Object.prototype.hasOwnProperty.call(payload, field)
    );

    if (shouldSyncZoom) {
        const updatedMeeting = await updateZoomMeeting(existingSession.zoom_meeting_id, {
            title: `Week ${existingSession.week_number}`,
            description: payload.theme ?? existingSession.theme,
            meeting_date: payload.session_date ?? formatDateValue(existingSession.session_date),
            start_time: payload.start_time ?? formatTimeValue(existingSession.start_time),
            end_time: payload.end_time ?? formatTimeValue(existingSession.end_time),
        });

        payload.zoom_link = updatedMeeting.join_url;
        payload.zoom_start_url = updatedMeeting.start_url;
        payload.zoom_password = updatedMeeting.password;
        payload.zoom_start_time = updatedMeeting.start_time;
        payload.zoom_duration = updatedMeeting.duration;
    }

    if (Object.keys(payload).length === 0) {
        return presentSession(existingSession);
    }

    await cohortSessionModel.updateSession(null, sessionId, payload);

    const updatedSession = await cohortSessionModel.getSessionById(sessionId);

    return presentSession(updatedSession);
};

module.exports = {
    createSessionsForCohort,
    getSessionsByCohortId,
    updateSession,
};
