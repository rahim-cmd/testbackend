const { validationResult } = require("express-validator");
const cohortReviewService = require("../services/cohortReviewService");

const resolveErrorStatus = (error) => error.statusCode || 500;

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

const upsertReviewForCohort = async (req, res) => {
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const review = await cohortReviewService.upsertReviewForCohort({
            cohortId: req.params.cohortId,
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
        const reviews = await cohortReviewService.getMyReviews(req.user.id);

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
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const limit = Number(req.query.limit || 12);
        const cohortId = req.query.cohort_id ? Number(req.query.cohort_id) : null;

        const reviews = await cohortReviewService.getHomepageReviews({
            limit,
            cohortId,
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
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const limit = Number(req.query.limit || 12);
        const cohortId = req.query.cohort_id ? Number(req.query.cohort_id) : null;

        const reviews = await cohortReviewService.getApprovedReviews({
            limit,
            cohortId,
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
        await cohortReviewService.deleteMyReview({
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
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const reviews = await cohortReviewService.getAdminReviews({
            status: req.query.status || null,
            cohortId: req.query.cohort_id ? Number(req.query.cohort_id) : null,
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
    if (handleValidationErrors(req, res)) {
        return;
    }

    try {
        const review = await cohortReviewService.moderateReview({
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
    upsertReviewForCohort,
    getMyReviews,
    getHomepageReviews,
    getApprovedReviews,
    deleteMyReview,
    getAdminReviews,
    moderateReview,
};
