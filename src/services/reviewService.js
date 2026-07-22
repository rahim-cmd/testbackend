const reviewModel = require("../models/reviewModel");

const throwHttpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

const upsertReviewForBooking = async ({ bookingId, userId, rating, reviewText, isPublic }) => {
    const eligibility = await reviewModel.getReviewEligibilityByBooking({
        bookingId,
        userId,
    });

    if (!eligibility) {
        throwHttpError("Booking not found.", 404);
    }

    if (eligibility.booking_status !== "approved") {
        throwHttpError("Only approved bookings can be reviewed.", 422);
    }

    if (!Number(eligibility.has_joined)) {
        throwHttpError("You can review only meetings you actually joined.", 422);
    }

    await reviewModel.upsertReview({
        bookingId,
        circleId: eligibility.circle_id,
        userId,
        rating,
        reviewText,
        isPublic,
    });

    return await reviewModel.getReviewByBookingAndUser({
        bookingId,
        userId,
    });
};

const getMyReviews = async (userId) => {
    return await reviewModel.getMyReviews(userId);
};

const getHomepageReviews = async ({ limit, circleId }) => {
    const reviews = await reviewModel.getHomepageReviews({
        limit,
        circleId,
    });

    return reviews.map((review) => ({
        ...review,
        reviewer_name: `${review.first_name || ""} ${review.last_name || ""}`.trim() || "Anonymous",
    }));
};

const getApprovedReviews = async ({ limit, circleId }) => {
    const reviews = await reviewModel.getApprovedReviews({
        limit,
        circleId,
    });

    return reviews.map((review) => ({
        ...review,
        reviewer_name: `${review.first_name || ""} ${review.last_name || ""}`.trim() || "Anonymous",
    }));
};

const deleteMyReview = async ({ reviewId, userId }) => {
    const review = await reviewModel.getMyReviewById({ reviewId, userId });

    if (!review) {
        throwHttpError("Review not found.", 404);
    }

    await reviewModel.deleteMyReview({ reviewId, userId });
};

const getAdminReviews = async ({ status, circleId, limit }) => {
    const reviews = await reviewModel.getAdminReviews({
        status,
        circleId,
        limit,
    });

    return reviews.map((review) => ({
        ...review,
        reviewer_name: `${review.first_name || ""} ${review.last_name || ""}`.trim() || "Anonymous",
    }));
};

const moderateReview = async ({ reviewId, status, adminId, note }) => {
    const review = await reviewModel.getReviewById(reviewId);

    if (!review) {
        throwHttpError("Review not found.", 404);
    }

    if (!["approved", "rejected"].includes(status)) {
        throwHttpError("Invalid moderation status.", 422);
    }

    await reviewModel.updateReviewModeration({
        reviewId,
        status,
        adminId,
        note,
    });

    return await reviewModel.getReviewById(reviewId);
};

module.exports = {
    upsertReviewForBooking,
    getMyReviews,
    getHomepageReviews,
    getApprovedReviews,
    deleteMyReview,
    getAdminReviews,
    moderateReview,
};
