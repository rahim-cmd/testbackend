const { validationResult } = require("express-validator");
const testimonialService = require("../services/testimonialService");

const getTestimonials = async (req, res) => {
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
        const reviews = await testimonialService.getTestimonials({
            limit: req.query.limit || 50,
        });

        return res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getTestimonials,
};
