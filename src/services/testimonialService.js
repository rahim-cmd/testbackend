const reviewModel = require("../models/reviewModel");
const cohortReviewModel = require("../models/cohortReviewModel");

const buildReviewerName = (review) =>
    `${review.first_name || ""} ${review.last_name || ""}`.trim() || "Anonymous";

// Single, read-only aggregator for the public Testimonials page — combines
// approved+public reviews from booking_reviews (circle) and cohort_reviews
// without altering either feature's own tables, models, or admin moderation flow.
const getTestimonials = async ({ limit }) => {
    const parsedLimit = Number.isInteger(Number(limit))
        ? Math.min(Math.max(Number(limit), 1), 200)
        : 50;

    const [circleReviews, cohortReviews] = await Promise.all([
        reviewModel.getApprovedReviews({ limit: parsedLimit, circleId: null }),
        cohortReviewModel.getApprovedReviews({ limit: parsedLimit, cohortId: null }),
    ]);

    const merged = [
        ...circleReviews.map((review) => ({
            id: review.id,
            source: "circle",
            rating: review.rating,
            review_text: review.review_text,
            reviewer_name: buildReviewerName(review),
            context_title: review.circle_title,
            created_at: review.created_at,
            updated_at: review.updated_at,
        })),
        ...cohortReviews.map((review) => ({
            id: review.id,
            source: "cohort",
            rating: review.rating,
            review_text: review.review_text,
            reviewer_name: buildReviewerName(review),
            context_title: review.cohort_title,
            created_at: review.created_at,
            updated_at: review.updated_at,
        })),
    ];

    merged.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

    return merged.slice(0, parsedLimit);
};

module.exports = {
    getTestimonials,
};
