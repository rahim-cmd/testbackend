const { validationResult } = require("express-validator");
const circleService = require("../services/circleService");

const createCircle = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            }))
        });
    }

    try {

        const result = await circleService.createCircle({
            ...req.body,
            userId: req.user.id,
            userRole: req.user.role

        });

        return res.status(201).json({

            success: true,

            message: "Circle created successfully.",

            data: result

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const getUpcomingCircles = async (req, res) => {

    try {

        const circles = await circleService.getUpcomingCircles();

        return res.status(200).json({

            success: true,

            data: circles

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const getAllCircles = async (req, res) => {

    try {

        const circles = await circleService.getAllCircles();

        return res.status(200).json({
            success: true,
            data: circles
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const getCircleById = async (req, res) => {

    try {

        const circle = await circleService.getCircleById(req.params.id);

        if (!circle) {

            return res.status(404).json({
                success: false,
                message: "Circle not found."
            });

        }

        return res.status(200).json({
            success: true,
            data: circle
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const updateCircle = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            }))
        });
    }

    try {

        const updated = await circleService.updateCircle({
            id: req.params.id,
            userId: req.user.id,
            ...req.body
        });

        if (!updated) {

            return res.status(404).json({
                success: false,
                message: "Circle not found or you are not authorized to update it."
            });

        }

        return res.status(200).json({

            success: true,
            message: "Circle updated successfully.",
            data: updated

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const deleteCircle = async (req, res) => {

    try {

        const deleted = await circleService.deleteCircle({
            id: req.params.id,
            userId: req.user.id
        });

        if (!deleted) {

            return res.status(404).json({
                success: false,
                message: "Circle not found or you are not authorized to delete it."
            });

        }

        return res.status(200).json({

            success: true,
            message: "Circle deleted successfully."

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

const adminUpdateCircle = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg,
            }))
        });
    }

    try {

        const updated = await circleService.updateCircleById({
            id: req.params.id,
            ...req.body
        });

        if (!updated) {

            return res.status(404).json({
                success: false,
                message: "Circle not found or no valid fields to update."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Circle updated successfully."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const adminDeleteCircle = async (req, res) => {

    try {

        const deleted = await circleService.deleteCircleById(req.params.id);

        if (!deleted) {

            return res.status(404).json({
                success: false,
                message: "Circle not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Circle deleted successfully."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const adminRegenerateCircleZoom = async (req, res) => {

    try {

        const meeting = await circleService.regenerateCircleZoomMeeting(req.params.id);

        if (!meeting) {
            return res.status(404).json({
                success: false,
                message: "Circle not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Zoom meeting regenerated successfully.",
            data: meeting
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const adminDeleteCircleZoom = async (req, res) => {

    try {

        const deleted = await circleService.deleteCircleZoomMeeting(req.params.id, req.body.reason);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Circle not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Zoom meeting removed successfully."
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {

    createCircle,
    getUpcomingCircles,
    getAllCircles,
    getCircleById,
    updateCircle,
    deleteCircle,
    adminUpdateCircle,
    adminDeleteCircle,
    adminRegenerateCircleZoom,
    adminDeleteCircleZoom

};