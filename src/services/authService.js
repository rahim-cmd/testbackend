const bcrypt = require("bcryptjs");

const userModel = require("../models/userModel");
const bookingModel = require("../models/bookingModel");
const { signToken } = require("../utils/jwt");

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
        zoom_status: null,
        zoom_message: null,
    };

    if (!booking) {
        return result;
    }

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

    const zoomPresentation = buildZoomPresentation(currentBooking);

    return {
        ...user,
        current_booking: {
            id: currentBooking.id,
            circle_id: currentBooking.circle_id,
            booking_status: currentBooking.booking_status,
            notes: currentBooking.notes,
            approved_at: currentBooking.approved_at,
            created_at: currentBooking.created_at,
            title: currentBooking.title,
            description: currentBooking.description,
            meeting_date: currentBooking.meeting_date,
            start_time: currentBooking.start_time,
            end_time: currentBooking.end_time,
            host_name: currentBooking.host_name,
            zoom_meeting_id: currentBooking.zoom_meeting_id,
            zoom_link: zoomPresentation.zoom_link,
            zoom_start_time: currentBooking.zoom_start_time,
            zoom_duration: currentBooking.zoom_duration,
            zoom_updated_at: currentBooking.zoom_updated_at,
            ...zoomPresentation,
        },
        current_booking_status: currentBooking.booking_status,
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