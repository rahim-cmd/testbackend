const cohortReviewModel = require("../models/cohortReviewModel");
const { sendAdminFormSubmissionAlert } = require("./emailService");

const throwHttpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

const upsertReviewForCohort = async ({ cohortId, userId, rating, reviewText, isPublic }) => {
    const membership = await cohortReviewModel.getEligibleMembership({
        cohortId,
        userId,
    });

    if (!membership) {
        throwHttpError("You are not a member of this cohort.", 404);
    }

    if (membership.status === "cancelled") {
        throwHttpError("Only active or completed cohort members can leave a review.", 422);
    }

    await cohortReviewModel.upsertReview({
        cohortId,
        userId,
        rating,
        reviewText,
        isPublic,
    });

    const review = await cohortReviewModel.getReviewByCohortAndUser({
        cohortId,
        userId,
    });

    try {
        const reviewDetails = await cohortReviewModel.getReviewById(review.id);

        if (reviewDetails) {
            await sendAdminFormSubmissionAlert({
                formType: "cohort_review",
                data: {
                    reviewer_name: `${reviewDetails.first_name} ${reviewDetails.last_name || ""}`.trim(),
                    reviewer_email: reviewDetails.email,
                    cohort_title: reviewDetails.cohort_title,
                    rating: reviewDetails.rating,
                    review_text: reviewDetails.review_text,
                    is_public: reviewDetails.is_public ? "Yes" : "No",
                },
            });
        }
    } catch (error) {
        // Review should remain successful even if the admin notification email fails.
        console.warn("Admin cohort review submission alert email failed:", error.message);
    }

    return review;
};

const getMyReviews = async (userId) => {
    return await cohortReviewModel.getMyReviews(userId);
};

const getHomepageReviews = async ({ limit, cohortId }) => {
    const reviews = await cohortReviewModel.getHomepageReviews({
        limit,
        cohortId,
    });

    return reviews.map((review) => ({
        ...review,
        reviewer_name: `${review.first_name || ""} ${review.last_name || ""}`.trim() || "Anonymous",
    }));
};

const getApprovedReviews = async ({ limit, cohortId }) => {
    const reviews = await cohortReviewModel.getApprovedReviews({
        limit,
        cohortId,
    });

    return reviews.map((review) => ({
        ...review,
        reviewer_name: `${review.first_name || ""} ${review.last_name || ""}`.trim() || "Anonymous",
    }));
};

const deleteMyReview = async ({ reviewId, userId }) => {
    const review = await cohortReviewModel.getMyReviewById({ reviewId, userId });

    if (!review) {
        throwHttpError("Review not found.", 404);
    }

    await cohortReviewModel.deleteMyReview({ reviewId, userId });
};

const getAdminReviews = async ({ status, cohortId, limit }) => {
    const reviews = await cohortReviewModel.getAdminReviews({
        status,
        cohortId,
        limit,
    });

    return reviews.map((review) => ({
        ...review,
        reviewer_name: `${review.first_name || ""} ${review.last_name || ""}`.trim() || "Anonymous",
    }));
};

const moderateReview = async ({ reviewId, status, adminId, note }) => {
    const review = await cohortReviewModel.getReviewById(reviewId);

    if (!review) {
        throwHttpError("Review not found.", 404);
    }

    if (!["approved", "rejected"].includes(status)) {
        throwHttpError("Invalid moderation status.", 422);
    }

    await cohortReviewModel.updateReviewModeration({
        reviewId,
        status,
        adminId,
        note,
    });

    return await cohortReviewModel.getReviewById(reviewId);
};

module.exports = {
    upsertReviewForCohort,
    getMyReviews,
    getHomepageReviews,
    getApprovedReviews,
    deleteMyReview,
    getAdminReviews,
    moderateReview,
};
