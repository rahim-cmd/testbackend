const db = require("../config/db");
const availabilitySlotModel = require("../models/availabilitySlotModel");
const callBookingModel = require("../models/callBookingModel");
const {
    sendAdminCallBookingAlertEmail,
    sendCallBookingConfirmationEmail,
    sendCallBookingStatusEmail,
} = require("./emailService");

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOT_DURATION_MINUTES = 20;

const getDayOfWeek = (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return DAY_NAMES[date.getUTCDay()];
};

const addMinutesToTime = (timeString, minutes) => {
    const [hour, minute] = timeString.split(":").map(Number);
    const totalMinutes = (hour * 60 + minute + minutes) % (24 * 60);
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;

    return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
};

const getMonthRange = (month) => {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const [year, monthNumber] = targetMonth.split("-").map(Number);
    const monthStart = `${targetMonth}-01`;
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const monthEnd = `${targetMonth}-${String(lastDay).padStart(2, "0")}`;

    return { monthStart, monthEnd };
};

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

const createAvailabilitySlots = async ({ dates, adminId }) => {
    if (!Array.isArray(dates) || dates.length === 0) {
        throw new Error("At least one date with time slots is required.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const connection = await db.getConnection();

    let created = 0;
    let skipped = 0;

    try {
        await connection.beginTransaction();

        for (const entry of dates) {
            const slotDate = entry.date;

            if (!slotDate || slotDate < today) {
                throw new Error(`Date ${slotDate} must be today or a future date.`);
            }

            const dayOfWeek = getDayOfWeek(slotDate);
            const times = Array.isArray(entry.times) ? entry.times : [];

            for (const startTime of times) {
                const endTime = addMinutesToTime(startTime, SLOT_DURATION_MINUTES);

                const inserted = await availabilitySlotModel.createSlot(connection, {
                    slot_date: slotDate,
                    day_of_week: dayOfWeek,
                    start_time: startTime,
                    end_time: endTime,
                    duration_minutes: SLOT_DURATION_MINUTES,
                    created_by_admin_id: adminId,
                });

                if (inserted) {
                    created += 1;
                } else {
                    skipped += 1;
                }
            }
        }

        await connection.commit();

        return { created, skipped };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getPublicAvailability = async ({ month }) => {
    const { monthStart, monthEnd } = getMonthRange(month);
    const slots = await availabilitySlotModel.getAvailableSlotsForMonth(monthStart, monthEnd);

    const groupedByDate = new Map();

    for (const slot of slots) {
        const dateKey = formatDateValue(slot.slot_date);

        if (!groupedByDate.has(dateKey)) {
            groupedByDate.set(dateKey, {
                date: dateKey,
                day_of_week: slot.day_of_week,
                slots: [],
            });
        }

        groupedByDate.get(dateKey).slots.push({
            id: slot.id,
            start_time: formatTimeValue(slot.start_time),
            end_time: formatTimeValue(slot.end_time),
        });
    }

    return Array.from(groupedByDate.values());
};

const getAdminSlots = async ({ month, status }) => {
    const { monthStart, monthEnd } = month ? getMonthRange(month) : {};
    const slots = await availabilitySlotModel.getSlotsForAdmin({ monthStart, monthEnd, status });

    return slots.map((slot) => ({
        ...slot,
        slot_date: formatDateValue(slot.slot_date),
        start_time: formatTimeValue(slot.start_time),
        end_time: formatTimeValue(slot.end_time),
    }));
};

const deleteAvailabilitySlot = async (slotId) => {
    const deleted = await availabilitySlotModel.deleteAvailableSlot(slotId);

    if (!deleted) {
        throw new Error("Slot not found or it is already booked.");
    }
};

const createCallBooking = async ({ slotId, name, email, phone, message }) => {
    const connection = await db.getConnection();

    let bookingId;

    try {
        await connection.beginTransaction();

        const slot = await availabilitySlotModel.getSlotByIdForUpdate(connection, slotId);

        if (!slot) {
            throw new Error("Selected time slot was not found.");
        }

        if (slot.status !== "available") {
            throw new Error("Selected time slot is no longer available.");
        }

        await availabilitySlotModel.updateSlotStatus(connection, slotId, "booked");

        bookingId = await callBookingModel.createCallBooking(connection, {
            slot_id: slotId,
            name,
            email,
            phone,
            message,
        });

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    const booking = await callBookingModel.getCallBookingWithSlot(bookingId);
    const slotDate = formatDateValue(booking.slot_date);
    const startTime = formatTimeValue(booking.start_time);
    const endTime = formatTimeValue(booking.end_time);

    try {
        await sendAdminCallBookingAlertEmail({
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
            message: booking.message,
            slotDate,
            dayOfWeek: booking.day_of_week,
            startTime,
            endTime,
        });

        await sendCallBookingConfirmationEmail({
            to: booking.email,
            name: booking.name,
            slotDate,
            dayOfWeek: booking.day_of_week,
            startTime,
            endTime,
        });
    } catch (error) {
        // Booking should remain successful even if notification emails fail.
        console.warn("Call booking notification email failed:", error.message);
    }

    return {
        id: booking.id,
        slot_date: slotDate,
        day_of_week: booking.day_of_week,
        start_time: startTime,
        end_time: endTime,
        status: booking.status,
    };
};

const getAllCallBookingsForAdmin = async ({ status }) => {
    const bookings = await callBookingModel.getAllCallBookings({ status });

    return bookings.map((booking) => ({
        ...booking,
        slot_date: formatDateValue(booking.slot_date),
        start_time: formatTimeValue(booking.start_time),
        end_time: formatTimeValue(booking.end_time),
    }));
};

const updateCallBookingStatus = async ({ bookingId, status, adminNote }) => {
    const booking = await callBookingModel.getCallBookingWithSlot(bookingId);

    if (!booking) {
        throw new Error("Call booking not found.");
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await callBookingModel.updateCallBookingStatus(connection, bookingId, status, adminNote);

        if (status === "cancelled") {
            await availabilitySlotModel.updateSlotStatus(connection, booking.slot_id, "available");
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    const slotDate = formatDateValue(booking.slot_date);
    const startTime = formatTimeValue(booking.start_time);
    const endTime = formatTimeValue(booking.end_time);

    try {
        await sendCallBookingStatusEmail({
            to: booking.email,
            name: booking.name,
            slotDate,
            dayOfWeek: booking.day_of_week,
            startTime,
            endTime,
            status,
            adminNote,
        });
    } catch (error) {
        console.warn("Call booking status email failed:", error.message);
    }

    return {
        id: bookingId,
        status,
    };
};

module.exports = {
    createAvailabilitySlots,
    getPublicAvailability,
    getAdminSlots,
    deleteAvailabilitySlot,
    createCallBooking,
    getAllCallBookingsForAdmin,
    updateCallBookingStatus,
};
