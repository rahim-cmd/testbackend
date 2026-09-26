const { validationResult } = require("express-validator");
const cohortMembershipService = require("../services/cohortMembershipService");
const cohortSessionService = require("../services/cohortSessionService");

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

const allotMember = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await cohortMembershipService.allotUserToCohort({
            cohortId: req.params.id,
            userId: req.body.user_id,
            email: req.body.email,
            waitlistEntryId: req.body.waitlist_entry_id,
            adminId: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: "User allotted to cohort successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getCohortMembers = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const members = await cohortMembershipService.getCohortMembers(req.params.id);

        return res.status(200).json({
            success: true,
            data: members,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateMemberStatus = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await cohortMembershipService.updateMemberStatus({
            memberId: req.params.memberId,
            status: req.body.status,
            adminId: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: `Member marked as ${req.body.status}.`,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateMemberJoinControl = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await cohortMembershipService.setMemberJoinControl({
            memberId: req.params.memberId,
            isEnabled: req.body.is_enabled,
            adminId: req.user.id,
            reason: req.body.reason,
        });

        return res.status(200).json({
            success: true,
            message: "Join control updated successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getMemberJoinLogs = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const logs = await cohortMembershipService.getMemberJoinLogs(req.params.memberId);

        return res.status(200).json({
            success: true,
            data: logs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const sendDirectSessionLink = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await cohortMembershipService.sendDirectSessionLink({
            sessionId: req.params.sessionId,
            memberId: req.params.memberId,
            adminId: req.user.id,
            adminNote: req.body.admin_note,
        });

        return res.status(200).json({
            success: true,
            message: "Zoom link sent directly to the member.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getMyCohort = async (req, res) => {
    try {
        const cohort = await cohortMembershipService.getMyCohort(req.user.id);

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

const startSessionJoin = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await cohortMembershipService.startSessionJoin({
            memberId: req.params.memberId,
            sessionId: req.params.sessionId,
            userId: req.user.id,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
        });

        return res.status(200).json({
            success: true,
            message: "Join session started successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const endSessionJoin = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const result = await cohortMembershipService.endSessionJoin({
            memberId: req.params.memberId,
            sessionId: req.params.sessionId,
            userId: req.user.id,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
        });

        return res.status(200).json({
            success: true,
            message: "Join session ended successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const createSessions = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const sessions = await cohortSessionService.createSessionsForCohort({
            cohortId: req.params.id,
            sessions: req.body.sessions,
        });

        return res.status(201).json({
            success: true,
            message: "Cohort sessions created successfully.",
            data: sessions,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getSessions = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const sessions = await cohortSessionService.getSessionsByCohortId(req.params.id);

        return res.status(200).json({
            success: true,
            data: sessions,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateSession = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const session = await cohortSessionService.updateSession(req.params.sessionId, req.body);

        return res.status(200).json({
            success: true,
            message: "Session updated successfully.",
            data: session,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    allotMember,
    getCohortMembers,
    updateMemberStatus,
    updateMemberJoinControl,
    getMemberJoinLogs,
    sendDirectSessionLink,
    getMyCohort,
    startSessionJoin,
    endSessionJoin,
    createSessions,
    getSessions,
    updateSession,
};
