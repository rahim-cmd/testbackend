const cohortModel = require("../models/cohortModel");
const cohortWaitlistModel = require("../models/cohortWaitlistModel");
const {
    sendAdminWaitlistAlertEmail,
    sendWaitlistConfirmationEmail,
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

const parseFeatures = (featuresJson) => {
    if (!featuresJson) {
        return [];
    }

    try {
        const parsed = JSON.parse(featuresJson);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const presentCohort = (cohort) => {
    if (!cohort) {
        return null;
    }

    const seatsAvailable = Math.max(cohort.max_members - cohort.seats_taken, 0);

    return {
        ...cohort,
        start_date: formatDateValue(cohort.start_date),
        features: parseFeatures(cohort.features_json),
        seats_available: seatsAvailable,
        is_full: seatsAvailable === 0,
    };
};

const createCohort = async (cohortData) => {
    const cohortId = await cohortModel.createCohort({
        title: cohortData.title,
        description: cohortData.description || null,
        price: cohortData.price,
        currency: cohortData.currency || "GBP",
        duration_weeks: cohortData.duration_weeks || 7,
        session_duration_minutes: cohortData.session_duration_minutes || 90,
        max_members: cohortData.max_members || 6,
        seats_taken: cohortData.seats_taken || 0,
        start_date: cohortData.start_date || null,
        session_day: cohortData.session_day || null,
        session_time: cohortData.session_time || null,
        workbook_url: cohortData.workbook_url || null,
        features_json: JSON.stringify(cohortData.features || []),
        status: cohortData.status || "open",
        created_by_admin_id: cohortData.adminId,
    });

    const cohort = await cohortModel.getCohortById(cohortId);

    return presentCohort(cohort);
};

const getCurrentCohort = async () => {
    const cohort = await cohortModel.getCurrentCohort();

    return presentCohort(cohort);
};

const getAllCohorts = async () => {
    const cohorts = await cohortModel.getAllCohorts();

    return cohorts.map(presentCohort);
};

const getCohortById = async (cohortId) => {
    const cohort = await cohortModel.getCohortById(cohortId);

    return presentCohort(cohort);
};

const updateCohort = async (cohortId, updates) => {
    const existingCohort = await cohortModel.getCohortById(cohortId);

    if (!existingCohort) {
        throw new Error("Cohort not found.");
    }

    const allowedFields = [
        "title",
        "description",
        "price",
        "currency",
        "duration_weeks",
        "session_duration_minutes",
        "max_members",
        "seats_taken",
        "start_date",
        "session_day",
        "session_time",
        "workbook_url",
        "status",
    ];

    const payload = {};

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            payload[field] = updates[field];
        }
    }

    if (updates.features !== undefined) {
        payload.features_json = JSON.stringify(updates.features || []);
    }

    await cohortModel.updateCohort(cohortId, payload);

    const cohort = await cohortModel.getCohortById(cohortId);

    return presentCohort(cohort);
};

const deleteCohort = async (cohortId) => {
    const deleted = await cohortModel.deleteCohort(cohortId);

    if (!deleted) {
        throw new Error("Cohort not found.");
    }
};

const joinWaitlist = async ({ cohortId, name, email, phone, message }) => {
    let resolvedCohortId = cohortId || null;
    let cohort = null;

    if (resolvedCohortId) {
        cohort = await cohortModel.getCohortById(resolvedCohortId);
    } else {
        cohort = await cohortModel.getCurrentCohort();
        resolvedCohortId = cohort ? cohort.id : null;
    }

    const entryId = await cohortWaitlistModel.createWaitlistEntry({
        cohort_id: resolvedCohortId,
        name,
        email,
        phone,
        message,
    });

    try {
        await sendAdminWaitlistAlertEmail({
            name,
            email,
            phone,
            message,
            cohortTitle: cohort ? cohort.title : null,
        });

        await sendWaitlistConfirmationEmail({
            to: email,
            name,
            cohortTitle: cohort ? cohort.title : null,
        });
    } catch (error) {
        // Waitlist signup should remain successful even if notification emails fail.
        console.warn("Waitlist notification email failed:", error.message);
    }

    return {
        id: entryId,
        cohort_id: resolvedCohortId,
    };
};

const getAllWaitlistEntries = async ({ status, cohortId }) => {
    const entries = await cohortWaitlistModel.getAllWaitlistEntries({ status, cohortId });

    return entries.map((entry) => ({
        ...entry,
        created_at: entry.created_at,
    }));
};

const updateWaitlistEntryStatus = async ({ entryId, status, adminNote }) => {
    const entry = await cohortWaitlistModel.getWaitlistEntryById(entryId);

    if (!entry) {
        throw new Error("Waitlist entry not found.");
    }

    // Seat counting only happens via the member allotment endpoint (cohortMembershipService.allotUserToCohort)
    // to avoid double-incrementing seats_taken when a waitlist entry is later allotted to a cohort.
    await cohortWaitlistModel.updateWaitlistEntryStatus(null, entryId, status, adminNote);

    return {
        id: entryId,
        status,
    };
};

module.exports = {
    createCohort,
    getCurrentCohort,
    getAllCohorts,
    getCohortById,
    updateCohort,
    deleteCohort,
    joinWaitlist,
    getAllWaitlistEntries,
    updateWaitlistEntryStatus,
};
