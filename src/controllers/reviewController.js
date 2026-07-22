const { validationResult } = require("express-validator");
const reviewService = require("../services/reviewService");

const resolveErrorStatus = (error) => error.statusCode || 500;

const upsertReviewForBooking = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });
    }

    try {
        const review = await reviewService.upsertReviewForBooking({
            bookingId: req.params.bookingId,
            userId: req.user.id,
            rating: req.body.rating,
            reviewText: req.body.review_text,
            isPublic: req.body.is_public !== undefined ? req.body.is_public : true,
        });

        return res.status(200).json({
            success: true,
            message: "Review saved successfully.",
            data: review,
        });
    } catch (error) {
        return res.status(resolveErrorStatus(error)).json({
            success: false,
            message: error.message,
        });
    }
};

const getMyReviews = async (req, res) => {
    try {
        const reviews = await reviewService.getMyReviews(req.user.id);

        return res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        return res.status(resolveErrorStatus(error)).json({
            success: false,
            message: error.message,
        });
    }
};

const getHomepageReviews = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });
    }

    try {
        const limit = Number(req.query.limit || 12);
        const circleId = req.query.circle_id ? Number(req.query.circle_id) : null;

        const reviews = await reviewService.getHomepageReviews({
            limit,
            circleId,
        });

        return res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        return res.status(resolveErrorStatus(error)).json({
            success: false,
            message: error.message,
        });
    }
};

const getApprovedReviews = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });
    }

    try {
        const limit = Number(req.query.limit || 12);
        const circleId = req.query.circle_id ? Number(req.query.circle_id) : null;

        const reviews = await reviewService.getApprovedReviews({
            limit,
            circleId,
        });

        return res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        return res.status(resolveErrorStatus(error)).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteMyReview = async (req, res) => {
    try {
        await reviewService.deleteMyReview({
            reviewId: req.params.id,
            userId: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully.",
        });
    } catch (error) {
        return res.status(resolveErrorStatus(error)).json({
            success: false,
            message: error.message,
        });
    }
};

const getAdminReviews = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });
    }

    try {
        const reviews = await reviewService.getAdminReviews({
            status: req.query.status || null,
            circleId: req.query.circle_id ? Number(req.query.circle_id) : null,
            limit: Number(req.query.limit || 50),
        });

        return res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        return res.status(resolveErrorStatus(error)).json({
            success: false,
            message: error.message,
        });
    }
};

const moderateReview = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            })),
        });
    }

    try {
        const review = await reviewService.moderateReview({
            reviewId: req.params.id,
            status: req.body.status,
            adminId: req.user.id,
            note: req.body.note,
        });

        return res.status(200).json({
            success: true,
            message: `Review ${req.body.status} successfully.`,
            data: review,
        });
    } catch (error) {
        return res.status(resolveErrorStatus(error)).json({
            success: false,
            message: error.message,
        });
    }
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
