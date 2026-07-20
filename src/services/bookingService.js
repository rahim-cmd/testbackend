const bookingModel = require("../models/bookingModel");
const db = require("../config/db");
const zoomMeetingModel = require("../models/zoomMeetingModel");
const { createZoomMeeting } = require("./zoomService");
const { sendBookingStatusEmail } = require("./emailService");

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

const formatDateTimeValue = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        return value.replace("T", " ").slice(0, 19);
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 19).replace("T", " ");
    }

    return value;
};

const normalizeBookingDates = (booking) => ({
    ...booking,
    meeting_date: formatDateValue(booking.meeting_date),
    approved_at: formatDateTimeValue(booking.approved_at),
    created_at: formatDateTimeValue(booking.created_at),
    zoom_start_time: formatDateTimeValue(booking.zoom_start_time),
    zoom_updated_at: formatDateTimeValue(booking.zoom_updated_at),
    join_locked_at: formatDateTimeValue(booking.join_locked_at),
    join_enabled_at: formatDateTimeValue(booking.join_enabled_at),
    join_disabled_at: formatDateTimeValue(booking.join_disabled_at),
});

const buildZoomPresentation = (booking) => {
    const result = {
        zoom_link: null,
        zoom_password: booking.zoom_password || null,
        zoom_status: null,
        zoom_message: null,
        join_enabled: Boolean(Number(booking.join_enabled ?? 1)),
        can_join: false,
        join_message: null,
        join_lock_reason: booking.join_lock_reason || null,
        join_locked_at: booking.join_locked_at || null,
    };

    if (booking.booking_status === "pending") {
        return {
            ...result,
            zoom_status: "pending",
            zoom_message: "Waiting for admin approval.",
            can_join: false,
            join_message: "Waiting for admin approval.",
        };
    }

    if (booking.booking_status === "rejected") {
        return {
            ...result,
            zoom_status: "rejected",
            zoom_message: booking.notes || "Your booking was not approved.",
            can_join: false,
            join_message: booking.notes || "Your booking was not approved.",
        };
    }

    if (booking.booking_status === "cancelled") {
        return {
            ...result,
            zoom_status: "cancelled",
            zoom_message: "This booking has been cancelled.",
            can_join: false,
            join_message: "This booking has been cancelled.",
        };
    }

    if (!booking.zoom_link) {
        return {
            ...result,
            zoom_status: "unavailable",
            zoom_message: "Meeting link is temporarily unavailable. Please check back later.",
            can_join: false,
            join_message: "Meeting link is temporarily unavailable. Please check back later.",
        };
    }

    const wasUpdated = booking.zoom_updated_at && booking.approved_at
        ? new Date(booking.zoom_updated_at).getTime() > new Date(booking.approved_at).getTime()
        : false;

    const joinEnabled = Boolean(Number(booking.join_enabled ?? 1));

    return {
        zoom_link: booking.zoom_link,
        zoom_password: booking.zoom_password || null,
        zoom_status: wasUpdated ? "updated" : "active",
        zoom_message: wasUpdated
            ? "Meeting details were updated. Please use the latest link below."
            : "Your meeting link is ready.",
        can_join: joinEnabled,
        join_message: !joinEnabled
            ? (booking.join_lock_reason || "Join access is disabled by admin.")
            : "Join is available from your dashboard.",
        join_enabled: joinEnabled,
        join_lock_reason: booking.join_lock_reason || null,
        join_locked_at: booking.join_locked_at || null,
    };
};

const createBooking = async (bookingData) => {

    const circle = await bookingModel.getCircleById(
        bookingData.circle_id
    );

    if (!circle) {
        throw new Error("Circle not found.");
    }

    if (!circle.booking_open) {
        throw new Error("Booking is closed.");
    }

    if (circle.booked_members >= circle.max_members) {
        throw new Error("Circle is full.");
    }

    const existingBooking =
        await bookingModel.getExistingBooking(
            bookingData.user_id,
            bookingData.circle_id
        );

    if (existingBooking) {
        throw new Error(
            "You have already booked this circle."
        );
    }

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const bookingId =
            await bookingModel.createBooking(
                connection,
                bookingData
            );

        await connection.commit();

        return {
            id: bookingId
        };

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }

};

const getMyBookings = async (userId) => {

    const bookings = await bookingModel.getMyBookings(userId);

    return bookings.map((booking) => {
        const normalizedBooking = normalizeBookingDates(booking);

        return {
            ...normalizedBooking,
            ...buildZoomPresentation(normalizedBooking),
        };
    });

};

const getAllBookings = async () => {
    return await bookingModel.getAllBookings();
};

const getMyBookingJoinLogs = async (bookingId, userId) => {
    const booking = await bookingModel.getBookingJoinContext(bookingId, userId);

    if (!booking) {
        throw new Error("Booking not found.");
    }

    return await bookingModel.getBookingJoinLogsByBookingId(bookingId);
};

const startBookingJoinSession = async ({ bookingId, userId, ipAddress, userAgent }) => {
    const booking = await bookingModel.getBookingJoinContext(bookingId, userId);

    if (!booking) {
        throw new Error("Booking not found.");
    }

    if (booking.booking_status !== "approved") {
        throw new Error("Booking is not approved yet.");
    }

    const presentation = buildZoomPresentation(booking);

    if (!presentation.can_join) {
        throw new Error(presentation.join_message || "Meeting cannot be joined right now.");
    }

    if (!presentation.join_enabled) {
        throw new Error(presentation.join_lock_reason || "Join access is disabled by admin.");
    }

    await bookingModel.createBookingJoinLog(null, {
        booking_id: bookingId,
        user_id: userId,
        event_type: "join_started",
        event_source: "user",
        status: "success",
        message: "User opened the meeting from the dashboard.",
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
    });

    return {
        id: bookingId,
        join_enabled: Boolean(Number(booking.join_enabled ?? 1)),
        can_join: Boolean(Number(booking.join_enabled ?? 1)),
        join_message: "Join access is controlled by admin.",
    };
};

const endBookingJoinSession = async ({ bookingId, userId, ipAddress, userAgent }) => {
    const booking = await bookingModel.getBookingJoinContext(bookingId, userId);

    if (!booking) {
        throw new Error("Booking not found.");
    }

    await bookingModel.createBookingJoinLog(null, {
        booking_id: bookingId,
        user_id: userId,
        event_type: "join_ended",
        event_source: "user",
        status: "success",
        message: "User ended the dashboard meeting session.",
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
    });

    return {
        id: bookingId,
        join_enabled: Boolean(Number(booking.join_enabled ?? 1)),
        can_join: Boolean(Number(booking.join_enabled ?? 1)),
        join_message: "Join access is controlled by admin.",
    };
};

const setBookingJoinControl = async ({ bookingId, isEnabled, adminId, reason }) => {
    const booking = await bookingModel.getBookingByIdForAdmin(bookingId);

    if (!booking) {
        throw new Error("Booking not found.");
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await bookingModel.setBookingJoinControl(connection, bookingId, {
            is_enabled: Boolean(isEnabled),
            locked_by_user_id: null,
            locked_by_admin_id: adminId,
            lock_reason: reason || null,
            locked_at: isEnabled ? null : new Date(),
            enabled_at: isEnabled ? new Date() : null,
            disabled_at: isEnabled ? null : new Date(),
        });

        await bookingModel.createBookingJoinLog(connection, {
            booking_id: bookingId,
            user_id: null,
            event_type: isEnabled ? "join_enabled" : "join_disabled",
            event_source: "admin",
            status: "success",
            message: reason || (isEnabled ? "Admin enabled meeting access." : "Admin disabled meeting access."),
            ip_address: null,
            user_agent: null,
        });

        await connection.commit();

        return {
            id: bookingId,
            join_enabled: Boolean(isEnabled),
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const updateBookingStatus = async ({ bookingId, status, reason, adminId }) => {
    const booking = await bookingModel.getBookingByIdForAdmin(bookingId);

    if (!booking) {
        throw new Error("Booking not found.");
    }

    if (!["approved", "rejected"].includes(status)) {
        throw new Error("Invalid booking status.");
    }

    if (booking.booking_status === status) {
        return {
            id: bookingId,
            status,
        };
    }

    let fallbackZoomMeeting = null;

    if (status === "approved") {
        const preApprovalCircle = await bookingModel.getCircleDetails(bookingId);

        if (!preApprovalCircle) {
            throw new Error("Circle not found for this booking.");
        }

        if (!preApprovalCircle.zoom_meeting_id || !preApprovalCircle.zoom_link) {
            fallbackZoomMeeting = await createZoomMeeting({
                title: preApprovalCircle.title,
                description: preApprovalCircle.description,
                meeting_date: preApprovalCircle.meeting_date,
                start_time: preApprovalCircle.start_time,
                end_time: preApprovalCircle.end_time,
            });
        }
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await bookingModel.updateBookingStatus(connection, bookingId, status, adminId, reason);

        if (status === "approved") {
            if (fallbackZoomMeeting) {
                await bookingModel.updateCircleZoomConfig(connection, booking.circle_id, {
                    zoom_link: fallbackZoomMeeting.join_url,
                    zoom_meeting_id: fallbackZoomMeeting.meeting_id,
                    zoom_start_url: fallbackZoomMeeting.start_url,
                    zoom_password: fallbackZoomMeeting.password,
                    zoom_start_time: fallbackZoomMeeting.start_time,
                    zoom_duration: fallbackZoomMeeting.duration,
                });
            }

            const circle = await bookingModel.getCircleDetails(bookingId);

            if (!circle || !circle.zoom_meeting_id || !circle.zoom_link) {
                throw new Error("Zoom meeting is not configured for this circle.");
            }

            await zoomMeetingModel.upsertZoomMeetingForBooking(connection, {
                booking_id: bookingId,
                meeting_id: circle.zoom_meeting_id,
                topic: circle.title,
                join_url: circle.zoom_link,
                start_url: circle.zoom_start_url,
                password: circle.zoom_password,
                start_time: circle.zoom_start_time,
                duration: circle.zoom_duration,
            });
        } else {
            await zoomMeetingModel.deleteZoomMeetingByBookingId(connection, bookingId);
        }

        await connection.commit();

        const user = await bookingModel.getBookingUser(bookingId);
        const circle = await bookingModel.getCircleDetails(bookingId);

        if (user && circle) {
            await sendBookingStatusEmail({
                to: user.email,
                userName: `${user.first_name} ${user.last_name || ""}`.trim(),
                circleTitle: circle.title,
                status,
                reason,
                dashboardUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/dashboard` : null,
            });
        }

        return {
            id: bookingId,
            status,
            zoom_link: status === "approved" ? circle?.zoom_link || null : null,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const cancelBooking = async (
    bookingId,
    userId
) => {

    const booking =
        await bookingModel.getBookingById(
            bookingId,
            userId
        );

    if (!booking) {
        throw new Error("Booking not found.");
    }

    if (booking.booking_status === "cancelled") {
        throw new Error("Booking already cancelled.");
    }

    const connection =
        await db.getConnection();

    try {

        await connection.beginTransaction();

        await bookingModel.cancelBooking(
            connection,
            bookingId,
            userId
        );

        await connection.commit();

    } catch (error) {

        await connection.rollback();

        throw error;

    } finally {

        connection.release();

    }

};

const setCircleJoinControl = async ({ circleId, isEnabled, adminId, reason }) => {
    const circle = await bookingModel.getCircleByIdForAdmin(circleId);

    if (!circle) {
        throw new Error("Circle not found.");
    }

    const bookingIds = await bookingModel.getBookingIdsByCircleId(circleId);

    if (!bookingIds.length) {
        return {
            circle_id: Number(circleId),
            join_enabled: Boolean(isEnabled),
            affected_bookings: 0,
        };
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        for (const bookingId of bookingIds) {
            await bookingModel.setBookingJoinControl(connection, bookingId, {
                is_enabled: Boolean(isEnabled),
                locked_by_user_id: null,
                locked_by_admin_id: adminId,
                lock_reason: reason || null,
                locked_at: isEnabled ? null : new Date(),
                enabled_at: isEnabled ? new Date() : null,
                disabled_at: isEnabled ? null : new Date(),
            });

            await bookingModel.createBookingJoinLog(connection, {
                booking_id: bookingId,
                user_id: null,
                event_type: isEnabled ? "join_enabled" : "join_disabled",
                event_source: "admin",
                status: "success",
                message: reason || (isEnabled
                    ? "Admin enabled meeting access for this circle."
                    : "Admin disabled meeting access for this circle."),
                ip_address: null,
                user_agent: null,
            });
        }

        await connection.commit();

        return {
            circle_id: Number(circleId),
            join_enabled: Boolean(isEnabled),
            affected_bookings: bookingIds.length,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getAllBookings,
    getMyBookingJoinLogs,
    startBookingJoinSession,
    endBookingJoinSession,
    setBookingJoinControl,
    setCircleJoinControl,
    updateBookingStatus,
    cancelBooking
};