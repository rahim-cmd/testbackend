const db = require("../config/db");
const circleModel = require("../models/circleModel");
const zoomMeetingModel = require("../models/zoomMeetingModel");
const zoomEventLogModel = require("../models/zoomEventLogModel");
const {
    createZoomMeeting,
    updateZoomMeeting,
    deleteZoomMeeting,
    getZoomMeeting,
} = require("./zoomService");
const { sendZoomMeetingUpdateEmail } = require("./emailService");

const toPayloadJson = (payload) => {
    if (!payload) {
        return null;
    }

    return JSON.stringify(payload);
};

const logZoomEvent = async (logData, connection) => {
    await zoomEventLogModel.createZoomEventLog(connection, {
        circle_id: logData.circle_id,
        meeting_id: logData.meeting_id,
        event_type: logData.event_type,
        event_source: logData.event_source,
        status: logData.status,
        message: logData.message,
        payload_json: toPayloadJson(logData.payload),
    });
};

const toCircleZoomFields = (meetingRecord) => ({
    zoom_link: meetingRecord.join_url,
    zoom_meeting_id: meetingRecord.meeting_id,
    zoom_start_url: meetingRecord.start_url,
    zoom_password: meetingRecord.password,
    zoom_start_time: meetingRecord.start_time,
    zoom_duration: meetingRecord.duration,
});

const buildMergedCircleData = (existingCircle, updates) => ({
    title: updates.title ?? existingCircle.title,
    description: updates.description ?? existingCircle.description,
    meeting_date: updates.meeting_date ?? existingCircle.meeting_date,
    start_time: updates.start_time ?? existingCircle.start_time,
    end_time: updates.end_time ?? existingCircle.end_time,
});

const syncApprovedBookingSnapshots = async (connection, circleId, meetingRecord) => {
    const approvedBookings = await zoomMeetingModel.getApprovedBookingsForCircle(circleId);

    for (const booking of approvedBookings) {
        await zoomMeetingModel.upsertZoomMeetingForBooking(connection, {
            booking_id: booking.booking_id,
            meeting_id: meetingRecord.meeting_id,
            topic: meetingRecord.topic,
            join_url: meetingRecord.join_url,
            start_url: meetingRecord.start_url,
            password: meetingRecord.password,
            start_time: meetingRecord.start_time,
            duration: meetingRecord.duration,
        });
    }

    return approvedBookings;
};

const notifyApprovedUsers = async ({ circleId, changeType, zoomLink, reason }) => {
    const approvedBookings = await zoomMeetingModel.getApprovedBookingsForCircle(circleId);

    await Promise.all(
        approvedBookings.map((booking) => sendZoomMeetingUpdateEmail({
            to: booking.email,
            userName: `${booking.first_name} ${booking.last_name || ""}`.trim(),
            circleTitle: booking.title,
            changeType,
            zoomLink,
            reason,
        }))
    );
};

const createCircle = async (circleData) => {

    let zoomMeetingRecord = null;

    if (circleData.userRole === "admin") {
        zoomMeetingRecord = await createZoomMeeting({
            title: circleData.title,
            description: circleData.description,
            meeting_date: circleData.meeting_date,
            start_time: circleData.start_time,
            end_time: circleData.end_time,
        });
    }

    const circle = {

        title: circleData.title,

        description: circleData.description || null,

        meeting_date: circleData.meeting_date,

        start_time: circleData.start_time,

        end_time: circleData.end_time,

        max_members: circleData.max_members,

    zoom_link: zoomMeetingRecord ? zoomMeetingRecord.join_url : circleData.zoom_link || null,

    zoom_meeting_id: zoomMeetingRecord ? zoomMeetingRecord.meeting_id : null,

    zoom_start_url: zoomMeetingRecord ? zoomMeetingRecord.start_url : null,

    zoom_password: zoomMeetingRecord ? zoomMeetingRecord.password : null,

    zoom_start_time: zoomMeetingRecord ? zoomMeetingRecord.start_time : null,

    zoom_duration: zoomMeetingRecord ? zoomMeetingRecord.duration : null,

        host_name: circleData.host_name || null,

        created_by: circleData.userId

    };

    const circleId = await circleModel.createCircle(circle);

    if (zoomMeetingRecord) {
        await logZoomEvent({
            circle_id: circleId,
            meeting_id: zoomMeetingRecord.meeting_id,
            event_type: "meeting.created",
            event_source: "admin",
            status: "success",
            message: "Zoom meeting created automatically during circle creation.",
            payload: zoomMeetingRecord,
        });
    }

    return {

        id: circleId,
        zoom_link: circle.zoom_link,
        zoom_meeting_id: circle.zoom_meeting_id

    };

};

const getUpcomingCircles = async () => {

    return await circleModel.getUpcomingCircles();

};

const getAllCircles = async () => {

    return await circleModel.getAllCircles();

};

const getCircleById = async (id) => {

    return await circleModel.getCircleById(id);

};

const updateCircle = async (circleData) => {

    const allowedFields = [
        "title",
        "description",
        "meeting_date",
        "start_time",
        "end_time",
        "max_members",
        "zoom_link",
        "host_name"
    ];

    const updateData = {};

    allowedFields.forEach((field) => {

        if (Object.prototype.hasOwnProperty.call(circleData, field) && circleData[field] !== undefined) {
            updateData[field] = circleData[field];
        }

    });

    if (Object.keys(updateData).length === 0) {
        return false;
    }

    return await circleModel.updateCircle(circleData.id, circleData.userId, updateData);

};

const deleteCircle = async (circleData) => {

    const existingCircle = await circleModel.getCircleById(circleData.id);

    if (!existingCircle) {
        return false;
    }

    if (existingCircle.zoom_meeting_id) {
        await deleteZoomMeeting(existingCircle.zoom_meeting_id);
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        await zoomMeetingModel.deleteZoomMeetingsByCircleId(connection, circleData.id);
        await logZoomEvent({
            circle_id: circleData.id,
            meeting_id: existingCircle.zoom_meeting_id,
            event_type: "meeting.deleted",
            event_source: "admin",
            status: "success",
            message: "Circle deleted and related Zoom snapshots removed.",
            payload: { circle_id: circleData.id },
        }, connection);
        const deleted = await circleModel.deleteCircleWithConnection(connection, circleData.id, circleData.userId);
        await connection.commit();
        return deleted;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

};

const updateCircleById = async (circleData) => {

    const existingCircle = await circleModel.getCircleById(circleData.id);

    if (!existingCircle) {
        return false;
    }

    const allowedFields = [
        "title",
        "description",
        "meeting_date",
        "start_time",
        "end_time",
        "max_members",
        "host_name",
        "booking_open",
        "status"
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(circleData, field) && circleData[field] !== undefined) {
            updateData[field] = circleData[field];
        }
    });

    if (Object.keys(updateData).length === 0) {
        return false;
    }

    const shouldSyncZoomMeeting = Boolean(existingCircle.zoom_meeting_id) && [
        "title",
        "description",
        "meeting_date",
        "start_time",
        "end_time",
    ].some((field) => Object.prototype.hasOwnProperty.call(updateData, field));

    let updatedMeetingRecord = null;

    if (shouldSyncZoomMeeting) {
        updatedMeetingRecord = await updateZoomMeeting(
            existingCircle.zoom_meeting_id,
            buildMergedCircleData(existingCircle, updateData)
        );

        Object.assign(updateData, toCircleZoomFields(updatedMeetingRecord));
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const updated = await circleModel.updateCircleByIdWithConnection(connection, circleData.id, updateData);

        if (!updated) {
            await connection.rollback();
            return false;
        }

        if (updatedMeetingRecord) {
            await syncApprovedBookingSnapshots(connection, circleData.id, updatedMeetingRecord);
            await logZoomEvent({
                circle_id: circleData.id,
                meeting_id: updatedMeetingRecord.meeting_id,
                event_type: "meeting.updated",
                event_source: "admin",
                status: "success",
                message: "Zoom meeting synced after admin updated circle details.",
                payload: updatedMeetingRecord,
            }, connection);
        }

        await connection.commit();

        if (updatedMeetingRecord) {
            await notifyApprovedUsers({
                circleId: circleData.id,
                changeType: "updated",
                zoomLink: updatedMeetingRecord.join_url,
                reason: "Meeting details were updated by the admin.",
            });
        }

        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

};

const deleteCircleById = async (id) => {

    const existingCircle = await circleModel.getCircleById(id);

    if (!existingCircle) {
        return false;
    }

    if (existingCircle.zoom_meeting_id) {
        await deleteZoomMeeting(existingCircle.zoom_meeting_id);
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        await zoomMeetingModel.deleteZoomMeetingsByCircleId(connection, id);
        await logZoomEvent({
            circle_id: id,
            meeting_id: existingCircle.zoom_meeting_id,
            event_type: "meeting.deleted",
            event_source: "admin",
            status: "success",
            message: "Admin deleted the circle and related Zoom snapshots were removed.",
            payload: { circle_id: id },
        }, connection);
        const deleted = await circleModel.deleteCircleByIdWithConnection(connection, id);
        await connection.commit();
        return deleted;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

};

const regenerateCircleZoomMeeting = async (circleId) => {

    const circle = await circleModel.getCircleById(circleId);

    if (!circle) {
        return false;
    }

    if (circle.zoom_meeting_id) {
        await deleteZoomMeeting(circle.zoom_meeting_id);
    }

    const meetingRecord = await createZoomMeeting({
        title: circle.title,
        description: circle.description,
        meeting_date: circle.meeting_date,
        start_time: circle.start_time,
        end_time: circle.end_time,
    });

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await circleModel.updateCircleByIdWithConnection(connection, circleId, toCircleZoomFields(meetingRecord));
        await syncApprovedBookingSnapshots(connection, circleId, meetingRecord);
        await logZoomEvent({
            circle_id: circleId,
            meeting_id: meetingRecord.meeting_id,
            event_type: "meeting.regenerated",
            event_source: "admin",
            status: "success",
            message: "Admin regenerated the Zoom meeting link.",
            payload: meetingRecord,
        }, connection);

        await connection.commit();

        await notifyApprovedUsers({
            circleId,
            changeType: "updated",
            zoomLink: meetingRecord.join_url,
            reason: "A new Zoom meeting link has been generated for your circle.",
        });

        return meetingRecord;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

};

const deleteCircleZoomMeeting = async (circleId, reason) => {

    const circle = await circleModel.getCircleById(circleId);

    if (!circle) {
        return false;
    }

    if (circle.zoom_meeting_id) {
        await deleteZoomMeeting(circle.zoom_meeting_id);
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await circleModel.updateCircleByIdWithConnection(connection, circleId, {
            zoom_link: null,
            zoom_meeting_id: null,
            zoom_start_url: null,
            zoom_password: null,
            zoom_start_time: null,
            zoom_duration: null,
        });

        await zoomMeetingModel.deleteZoomMeetingsByCircleId(connection, circleId);
        await logZoomEvent({
            circle_id: circleId,
            meeting_id: circle.zoom_meeting_id,
            event_type: "meeting.removed",
            event_source: "admin",
            status: "success",
            message: reason || "Admin removed the Zoom meeting link.",
            payload: { circle_id: circleId, reason: reason || null },
        }, connection);

        await connection.commit();

        await notifyApprovedUsers({
            circleId,
            changeType: "removed",
            zoomLink: null,
            reason: reason || "Meeting link was removed by the admin. A fresh update will be shared soon.",
        });

        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

};

const getCircleZoomOverview = async (circleId) => {

    const circle = await circleModel.getCircleById(circleId);

    if (!circle) {
        return false;
    }

    const bookings = await zoomMeetingModel.getZoomOverviewForCircle(circleId);
    const approvedBookings = bookings.filter((booking) => booking.booking_status === "approved");
    const syncedBookings = approvedBookings.filter((booking) => booking.zoom_snapshot_id);
    const logs = await zoomEventLogModel.getZoomEventLogsByCircleId(circleId);

    return {
        circle: {
            id: circle.id,
            title: circle.title,
            meeting_date: circle.meeting_date,
            start_time: circle.start_time,
            end_time: circle.end_time,
            zoom_meeting_id: circle.zoom_meeting_id,
            zoom_link: circle.zoom_link,
            zoom_start_time: circle.zoom_start_time,
            zoom_duration: circle.zoom_duration,
        },
        sync_summary: {
            approved_count: approvedBookings.length,
            synced_count: syncedBookings.length,
            unsynced_count: approvedBookings.length - syncedBookings.length,
        },
        bookings,
        logs,
    };

};

const getCircleZoomLogs = async (circleId) => {

    const circle = await circleModel.getCircleById(circleId);

    if (!circle) {
        return false;
    }

    return await zoomEventLogModel.getZoomEventLogsByCircleId(circleId);

};

const resyncCircleZoomSnapshots = async (circleId) => {

    const circle = await circleModel.getCircleById(circleId);

    if (!circle) {
        return false;
    }

    if (!circle.zoom_meeting_id) {
        throw new Error("No Zoom meeting is configured for this circle.");
    }

    const liveMeeting = await getZoomMeeting(circle.zoom_meeting_id);
    const meetingRecord = {
        meeting_id: liveMeeting.id,
        topic: liveMeeting.topic || circle.title,
        join_url: liveMeeting.join_url || circle.zoom_link,
        start_url: liveMeeting.start_url || circle.zoom_start_url,
        password: liveMeeting.password || circle.zoom_password,
        start_time: liveMeeting.start_time
            ? new Date(liveMeeting.start_time).toISOString().slice(0, 19).replace("T", " ")
            : circle.zoom_start_time,
        duration: liveMeeting.duration || circle.zoom_duration,
    };

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await circleModel.updateCircleByIdWithConnection(connection, circleId, toCircleZoomFields(meetingRecord));
        const approvedBookings = await syncApprovedBookingSnapshots(connection, circleId, meetingRecord);
        await logZoomEvent({
            circle_id: circleId,
            meeting_id: meetingRecord.meeting_id,
            event_type: "meeting.resynced",
            event_source: "admin",
            status: "success",
            message: "Admin manually re-synced approved Zoom booking snapshots.",
            payload: {
                approved_count: approvedBookings.length,
                meetingRecord,
            },
        }, connection);

        await connection.commit();

        return {
            circle_id: circleId,
            meeting_id: meetingRecord.meeting_id,
            synced_count: approvedBookings.length,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

};

const buildMeetingRecordFromWebhook = async (eventObject, existingCircle) => {
    if (eventObject.join_url) {
        return {
            meeting_id: eventObject.id,
            topic: eventObject.topic || existingCircle.title,
            join_url: eventObject.join_url || existingCircle.zoom_link,
            start_url: eventObject.start_url || existingCircle.zoom_start_url,
            password: eventObject.password || existingCircle.zoom_password,
            start_time: eventObject.start_time
                ? new Date(eventObject.start_time).toISOString().slice(0, 19).replace("T", " ")
                : existingCircle.zoom_start_time,
            duration: eventObject.duration || existingCircle.zoom_duration,
        };
    }

    const liveMeeting = await getZoomMeeting(eventObject.id);

    return {
        meeting_id: liveMeeting.id,
        topic: liveMeeting.topic || existingCircle.title,
        join_url: liveMeeting.join_url || existingCircle.zoom_link,
        start_url: liveMeeting.start_url || existingCircle.zoom_start_url,
        password: liveMeeting.password || existingCircle.zoom_password,
        start_time: liveMeeting.start_time
            ? new Date(liveMeeting.start_time).toISOString().slice(0, 19).replace("T", " ")
            : existingCircle.zoom_start_time,
        duration: liveMeeting.duration || existingCircle.zoom_duration,
    };
};

const handleZoomWebhookEvent = async (webhookPayload) => {

    const event = webhookPayload.event;
    const eventObject = webhookPayload.payload?.object;

    if (!eventObject?.id) {
        await logZoomEvent({
            circle_id: null,
            meeting_id: null,
            event_type: event || "unknown",
            event_source: "zoom_webhook",
            status: "ignored",
            message: "No meeting id found in webhook payload.",
            payload: webhookPayload,
        });

        return {
            handled: false,
            reason: "No meeting id found in webhook payload.",
        };
    }

    const circle = await zoomMeetingModel.getCircleByZoomMeetingId(eventObject.id);

    if (!circle) {
        await logZoomEvent({
            circle_id: null,
            meeting_id: eventObject.id,
            event_type: event,
            event_source: "zoom_webhook",
            status: "ignored",
            message: "No circle is mapped to this Zoom meeting.",
            payload: webhookPayload,
        });

        return {
            handled: false,
            reason: "No circle is mapped to this Zoom meeting.",
        };
    }

    if (event === "meeting.deleted") {
        await deleteCircleZoomMeeting(circle.id, "Meeting link was removed from Zoom and has been disabled.");
        await logZoomEvent({
            circle_id: circle.id,
            meeting_id: eventObject.id,
            event_type: event,
            event_source: "zoom_webhook",
            status: "success",
            message: "Zoom webhook deleted the mapped meeting and backend disabled it.",
            payload: webhookPayload,
        });

        return {
            handled: true,
            action: "deleted",
            circle_id: circle.id,
        };
    }

    if (event === "meeting.updated") {
        const meetingRecord = await buildMeetingRecordFromWebhook(eventObject, circle);
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            await circleModel.updateCircleByIdWithConnection(connection, circle.id, toCircleZoomFields(meetingRecord));
            await syncApprovedBookingSnapshots(connection, circle.id, meetingRecord);
            await logZoomEvent({
                circle_id: circle.id,
                meeting_id: meetingRecord.meeting_id,
                event_type: event,
                event_source: "zoom_webhook",
                status: "success",
                message: "Zoom webhook updated the circle meeting and booking snapshots.",
                payload: webhookPayload,
            }, connection);
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        await notifyApprovedUsers({
            circleId: circle.id,
            changeType: "updated",
            zoomLink: meetingRecord.join_url,
            reason: "Meeting details were updated from Zoom.",
        });

        return {
            handled: true,
            action: "updated",
            circle_id: circle.id,
            zoom_link: meetingRecord.join_url,
        };
    }

    await logZoomEvent({
        circle_id: circle.id,
        meeting_id: eventObject.id,
        event_type: event,
        event_source: "zoom_webhook",
        status: "ignored",
        message: `Unhandled Zoom event: ${event}`,
        payload: webhookPayload,
    });

    return {
        handled: false,
        reason: `Unhandled Zoom event: ${event}`,
    };

};

module.exports = {

    createCircle,
    getUpcomingCircles,
    getAllCircles,
    getCircleById,
    updateCircle,
    deleteCircle,
    updateCircleById,
    deleteCircleById,
    regenerateCircleZoomMeeting,
    deleteCircleZoomMeeting,
    getCircleZoomOverview,
    getCircleZoomLogs,
    resyncCircleZoomSnapshots,
    handleZoomWebhookEvent

};