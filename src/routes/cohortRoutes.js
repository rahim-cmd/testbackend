const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const cohortController = require("../controllers/cohortController");
const cohortMemberController = require("../controllers/cohortMemberController");
const {
    createCohortValidation,
    updateCohortValidation,
    cohortIdParamValidation,
    joinWaitlistValidation,
    adminWaitlistListValidation,
    updateWaitlistStatusValidation,
} = require("../validators/cohortValidator");
const {
    allotMemberValidation,
    memberIdParamValidation,
    updateMemberStatusValidation,
    updateMemberJoinControlValidation,
    joinSessionValidation,
    sendDirectLinkValidation,
    createSessionsValidation,
    updateSessionValidation,
} = require("../validators/cohortMemberValidator");

router.get(
    "/current",
    cohortController.getCurrentCohort
);

router.post(
    "/waitlist",
    joinWaitlistValidation,
    cohortController.joinWaitlist
);

router.get(
    "/my",
    authenticate,
    cohortMemberController.getMyCohort
);

router.post(
    "/my/members/:memberId/sessions/:sessionId/join/start",
    authenticate,
    joinSessionValidation,
    cohortMemberController.startSessionJoin
);

router.post(
    "/my/members/:memberId/sessions/:sessionId/join/end",
    authenticate,
    joinSessionValidation,
    cohortMemberController.endSessionJoin
);

router.post(
    "/admin",
    authenticate,
    authenticate.isAdmin,
    createCohortValidation,
    cohortController.createCohort
);

router.get(
    "/admin",
    authenticate,
    authenticate.isAdmin,
    cohortController.getAllCohorts
);

router.get(
    "/admin/waitlist",
    authenticate,
    authenticate.isAdmin,
    adminWaitlistListValidation,
    cohortController.getAllWaitlistEntries
);

router.put(
    "/admin/waitlist/:id/status",
    authenticate,
    authenticate.isAdmin,
    updateWaitlistStatusValidation,
    cohortController.updateWaitlistEntryStatus
);

router.put(
    "/admin/members/:memberId/status",
    authenticate,
    authenticate.isAdmin,
    updateMemberStatusValidation,
    cohortMemberController.updateMemberStatus
);

router.put(
    "/admin/members/:memberId/join-control",
    authenticate,
    authenticate.isAdmin,
    updateMemberJoinControlValidation,
    cohortMemberController.updateMemberJoinControl
);

router.get(
    "/admin/members/:memberId/join-logs",
    authenticate,
    authenticate.isAdmin,
    memberIdParamValidation,
    cohortMemberController.getMemberJoinLogs
);

router.post(
    "/admin/sessions/:sessionId/members/:memberId/send-link",
    authenticate,
    authenticate.isAdmin,
    sendDirectLinkValidation,
    cohortMemberController.sendDirectSessionLink
);

router.put(
    "/admin/sessions/:sessionId",
    authenticate,
    authenticate.isAdmin,
    updateSessionValidation,
    cohortMemberController.updateSession
);

router.post(
    "/admin/:id/members",
    authenticate,
    authenticate.isAdmin,
    allotMemberValidation,
    cohortMemberController.allotMember
);

router.get(
    "/admin/:id/members",
    authenticate,
    authenticate.isAdmin,
    cohortIdParamValidation,
    cohortMemberController.getCohortMembers
);

router.post(
    "/admin/:id/sessions",
    authenticate,
    authenticate.isAdmin,
    createSessionsValidation,
    cohortMemberController.createSessions
);

router.get(
    "/admin/:id/sessions",
    authenticate,
    authenticate.isAdmin,
    cohortIdParamValidation,
    cohortMemberController.getSessions
);

router.get(
    "/admin/:id",
    authenticate,
    authenticate.isAdmin,
    cohortIdParamValidation,
    cohortController.getCohortById
);

router.put(
    "/admin/:id",
    authenticate,
    authenticate.isAdmin,
    updateCohortValidation,
    cohortController.updateCohort
);

router.delete(
    "/admin/:id",
    authenticate,
    authenticate.isAdmin,
    cohortIdParamValidation,
    cohortController.deleteCohort
);

module.exports = router;
