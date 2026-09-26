const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const cohortReviewController = require("../controllers/cohortReviewController");
const {
    reviewCreateValidation,
    homepageReviewValidation,
    reviewDeleteValidation,
    adminReviewListValidation,
    reviewModerationValidation,
} = require("../validators/cohortReviewValidator");

router.post(
    "/cohorts/:cohortId",
    authenticate,
    reviewCreateValidation,
    cohortReviewController.upsertReviewForCohort
);

router.get(
    "/me",
    authenticate,
    cohortReviewController.getMyReviews
);

router.get(
    "/homepage",
    homepageReviewValidation,
    cohortReviewController.getHomepageReviews
);

router.get(
    "/approved",
    homepageReviewValidation,
    cohortReviewController.getApprovedReviews
);

router.get(
    "/admin",
    authenticate,
    authenticate.isAdmin,
    adminReviewListValidation,
    cohortReviewController.getAdminReviews
);

router.put(
    "/:id/moderation",
    authenticate,
    authenticate.isAdmin,
    reviewModerationValidation,
    cohortReviewController.moderateReview
);

router.delete(
    "/:id",
    authenticate,
    reviewDeleteValidation,
    cohortReviewController.deleteMyReview
);

module.exports = router;
