const { validationResult } = require("express-validator");
const userService = require("../services/userService");

const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();

        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        const statusCode = error.message === "User not found." ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

const createUser = async (req, res) => {
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
        const user = await userService.createUser(req.body);

        return res.status(201).json({
            success: true,
            message: "User created successfully.",
            data: user,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const updateUser = async (req, res) => {
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
        const user = await userService.updateUserById(req.params.id, req.body);

        return res.status(200).json({
            success: true,
            message: "User updated successfully.",
            data: user,
        });
    } catch (error) {
        const statusCode = error.message === "User not found." ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        await userService.deleteUserById(req.params.id);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully.",
        });
    } catch (error) {
        const statusCode = error.message === "User not found." ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
