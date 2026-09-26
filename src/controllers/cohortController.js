const { validationResult } = require("express-validator");
const cohortService = require("../services/cohortService");

const handleValidationErrors = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });

        return true;
    }

    return false;
};

const getCurrentCohort = async (req, res) => {
    try {
        const cohort = await cohortService.getCurrentCohort();

        return res.status(200).json({
            success: true,
            data: cohort,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const joinWaitlist = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await cohortService.joinWaitlist({
            cohortId: req.body.cohort_id,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            message: req.body.message,
        });

        return res.status(201).json({
            success: true,
            message: "You have been added to the waitlist successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const createCohort = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const cohort = await cohortService.createCohort({
            ...req.body,
            adminId: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: "Cohort created successfully.",
            data: cohort,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getAllCohorts = async (req, res) => {
    try {
        const cohorts = await cohortService.getAllCohorts();

        return res.status(200).json({
            success: true,
            data: cohorts,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getCohortById = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const cohort = await cohortService.getCohortById(req.params.id);

        if (!cohort) {
            return res.status(404).json({
                success: false,
                message: "Cohort not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: cohort,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateCohort = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const cohort = await cohortService.updateCohort(req.params.id, req.body);

        return res.status(200).json({
            success: true,
            message: "Cohort updated successfully.",
            data: cohort,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteCohort = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        await cohortService.deleteCohort(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Cohort deleted successfully.",
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getAllWaitlistEntries = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const entries = await cohortService.getAllWaitlistEntries({
            status: req.query.status,
            cohortId: req.query.cohort_id,
        });

        return res.status(200).json({
            success: true,
            data: entries,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateWaitlistEntryStatus = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await cohortService.updateWaitlistEntryStatus({
            entryId: req.params.id,
            status: req.body.status,
            adminNote: req.body.admin_note,
        });

        return res.status(200).json({
            success: true,
            message: `Waitlist entry marked as ${req.body.status}.`,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getCurrentCohort,
    joinWaitlist,
    createCohort,
    getAllCohorts,
    getCohortById,
    updateCohort,
    deleteCohort,
    getAllWaitlistEntries,
    updateWaitlistEntryStatus,
};
