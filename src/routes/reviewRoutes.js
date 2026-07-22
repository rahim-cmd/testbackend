const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const reviewController = require("../controllers/reviewController");
const {
    reviewCreateValidation,
    homepageReviewValidation,
    reviewDeleteValidation,
    adminReviewListValidation,
    reviewModerationValidation,
} = require("../validators/reviewValidator");

router.post(
    "/bookings/:bookingId",
    authenticate,
    reviewCreateValidation,
    reviewController.upsertReviewForBooking
);

router.get(
    "/me",
    authenticate,
    reviewController.getMyReviews
);

router.get(
    "/homepage",
    homepageReviewValidation,
    reviewController.getHomepageReviews
);

router.get(
    "/approved",
    homepageReviewValidation,
    reviewController.getApprovedReviews
);

router.get(
    "/admin",
    authenticate,
    authenticate.isAdmin,
    adminReviewListValidation,
    reviewController.getAdminReviews
);

router.put(
    "/:id/moderation",
    authenticate,
    authenticate.isAdmin,
    reviewModerationValidation,
    reviewController.moderateReview
);

router.delete(
    "/:id",
    authenticate,
    reviewDeleteValidation,
    reviewController.deleteMyReview
);

module.exports = router;
