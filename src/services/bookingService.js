const bookingModel = require("../models/bookingModel");
const db = require("../config/db");
const zoomMeetingModel = require("../models/zoomMeetingModel");
const { createZoomMeeting } = require("./zoomService");
const { sendBookingStatusEmail } = require("./emailService");

const buildZoomPresentation = (booking) => {
    const result = {
        zoom_link: null,
        zoom_status: null,
        zoom_message: null,
    };

    if (booking.booking_status === "pending") {
        return {
            ...result,
            zoom_status: "pending",
            zoom_message: "Waiting for admin approval.",
        };
    }

    if (booking.booking_status === "rejected") {
        return {
            ...result,
            zoom_status: "rejected",
            zoom_message: booking.notes || "Your booking was not approved.",
        };
    }

    if (booking.booking_status === "cancelled") {
        return {
            ...result,
            zoom_status: "cancelled",
            zoom_message: "This booking has been cancelled.",
        };
    }

    if (!booking.zoom_link) {
        return {
            ...result,
            zoom_status: "unavailable",
            zoom_message: "Meeting link is temporarily unavailable. Please check back later.",
        };
    }

    const startTime = booking.zoom_start_time ? new Date(booking.zoom_start_time) : null;
    const duration = Number(booking.zoom_duration || 0);
    const expiresAt = startTime && duration > 0
        ? new Date(startTime.getTime() + duration * 60000)
        : null;

    if (expiresAt && Date.now() > expiresAt.getTime()) {
        return {
            ...result,
            zoom_status: "expired",
            zoom_message: "Meeting time has passed. This link is no longer active.",
        };
    }

    const wasUpdated = booking.zoom_updated_at && booking.approved_at
        ? new Date(booking.zoom_updated_at).getTime() > new Date(booking.approved_at).getTime()
        : false;

    return {
        zoom_link: booking.zoom_link,
        zoom_status: wasUpdated ? "updated" : "active",
        zoom_message: wasUpdated
            ? "Meeting details were updated. Please use the latest link below."
            : "Your meeting link is ready.",
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

    return bookings.map((booking) => ({
        ...booking,
        ...buildZoomPresentation(booking),
    }));

};

const getAllBookings = async () => {
    return await bookingModel.getAllBookings();
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
                zoomLink: circle.zoom_link,
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


module.exports = {
    createBooking,
    getMyBookings,
    getAllBookings,
    updateBookingStatus,
    cancelBooking
};