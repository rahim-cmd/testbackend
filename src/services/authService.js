const bcrypt = require("bcryptjs");

const userModel = require("../models/userModel");
const bookingModel = require("../models/bookingModel");
const { signToken } = require("../utils/jwt");
const { isWithinJoinWindow } = require("../utils/timezone");

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

const registerUser = async (userData) => {

    // Check existing email

    const existingUser = await userModel.findUserByEmail(userData.email);

    if (existingUser) {
        throw new Error("Email already exists.");
    }

    // Hash Password

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Prepare Data

    const newUser = {

        first_name: userData.first_name,

        last_name: userData.last_name || null,

        email: userData.email,

        phone: userData.phone || null,

        password: hashedPassword,

        role: "user",

        status: "active",

        email_verified: 0

    };

    // Insert User

    const userId = await userModel.createUser(newUser);

    // Generate JWT

    const token = signToken(
        {
            id: userId,
            email: newUser.email,
            role: newUser.role
        },
        process.env.JWT_EXPIRES_IN || "7d"
    );

    // Fetch User

    const user = await userModel.findUserById(userId);

    return {

        token,
        user

    };

};

const buildZoomPresentation = (booking) => {
    const result = {
        zoom_link: null,
        zoom_password: null,
        zoom_status: null,
        zoom_message: null,
        join_enabled: Boolean(Number(booking?.join_enabled ?? 1)),
        can_join: false,
        join_message: null,
        join_lock_reason: booking?.join_lock_reason || null,
        join_locked_at: booking?.join_locked_at || null,
    };

    if (!booking) {
        return result;
    }

    if (booking.booking_status === "pending") {
        return {
            ...result,
            zoom_status: "pending",
            zoom_message: "Waiting for admin approval.",
            join_message: "Waiting for admin approval.",
        };
    }

    if (booking.booking_status === "rejected") {
        return {
            ...result,
            zoom_status: "rejected",
            zoom_message: booking.notes || "Your booking was not approved.",
            join_message: booking.notes || "Your booking was not approved.",
        };
    }

    if (booking.booking_status === "cancelled") {
        return {
            ...result,
            zoom_status: "cancelled",
            zoom_message: "This booking has been cancelled.",
            join_message: "This booking has been cancelled.",
        };
    }

    if (!booking.zoom_link) {
        return {
            ...result,
            zoom_status: "unavailable",
            zoom_message: "Meeting link is temporarily unavailable. Please check back later.",
            join_message: "Meeting link is temporarily unavailable. Please check back later.",
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
            join_message: "Meeting time has passed. This link is no longer active.",
        };
    }

    const wasUpdated = booking.zoom_updated_at && booking.approved_at
        ? new Date(booking.zoom_updated_at).getTime() > new Date(booking.approved_at).getTime()
        : false;

    const joinWindowOpen = isWithinJoinWindow({
        meeting_date: booking.meeting_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
    });
    const joinEnabled = Boolean(Number(booking.join_enabled ?? 1));

    return {
        zoom_link: booking.zoom_link,
        zoom_password: booking.zoom_password || null,
        zoom_status: wasUpdated ? "updated" : "active",
        zoom_message: wasUpdated
            ? "Meeting details were updated. Please use the latest link below."
            : "Your meeting link is ready.",
        can_join: joinEnabled && joinWindowOpen,
        join_message: !joinEnabled
            ? (booking.join_lock_reason || "Join access is disabled by admin.")
            : (joinWindowOpen ? "Join is available from your dashboard." : "Join will be enabled 2 minutes before the meeting starts."),
        join_enabled: joinEnabled,
        join_lock_reason: booking.join_lock_reason || null,
        join_locked_at: booking.join_locked_at || null,
    };
};

const getProfile = async (userId) => {
    const user = await userModel.findUserById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    delete user.password;

    const currentBooking = await bookingModel.getLatestBookingForUser(userId);

    if (!currentBooking) {
        return {
            ...user,
            current_booking: null,
            current_booking_status: "not_requested",
            current_booking_message: "No active booking.",
        };
    }

    const normalizedBooking = normalizeBookingDates(currentBooking);
    const zoomPresentation = buildZoomPresentation(normalizedBooking);

    return {
        ...user,
        current_booking: {
            id: normalizedBooking.id,
            circle_id: normalizedBooking.circle_id,
            booking_status: normalizedBooking.booking_status,
            notes: normalizedBooking.notes,
            approved_at: normalizedBooking.approved_at,
            created_at: normalizedBooking.created_at,
            title: normalizedBooking.title,
            description: normalizedBooking.description,
            meeting_date: normalizedBooking.meeting_date,
            start_time: normalizedBooking.start_time,
            end_time: normalizedBooking.end_time,
            host_name: normalizedBooking.host_name,
            zoom_meeting_id: normalizedBooking.zoom_meeting_id,
            zoom_link: zoomPresentation.zoom_link,
            zoom_password: zoomPresentation.zoom_password,
            zoom_start_time: normalizedBooking.zoom_start_time,
            zoom_duration: normalizedBooking.zoom_duration,
            zoom_updated_at: normalizedBooking.zoom_updated_at,
            join_enabled: zoomPresentation.join_enabled,
            can_join: zoomPresentation.can_join,
            join_message: zoomPresentation.join_message,
            join_lock_reason: zoomPresentation.join_lock_reason,
            join_locked_at: zoomPresentation.join_locked_at,
            ...zoomPresentation,
        },
        current_booking_status: normalizedBooking.booking_status,
        current_booking_message: zoomPresentation.zoom_message,
    };
};

const loginUser = async (email, password) => {

    const user = await userModel.findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password.");
    }

    if (user.status !== "active") {
        throw new Error("Your account is inactive.");
    }

    const token = signToken(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            type: "access"
        },
        process.env.JWT_EXPIRES_IN || "7d"
    );

    delete user.password;

    return {
        token,
        user
    };
};

module.exports = {

    registerUser,
    loginUser,
    getProfile

};