const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

const sanitizeUser = (user) => {
    if (!user) {
        return user;
    }

    const { password, ...safeUser } = user;
    return safeUser;
};

const getAllUsers = async () => {
    const users = await userModel.getAllUsers();

    return users.map(sanitizeUser);
};

const getUserById = async (id) => {
    const user = await userModel.findUserById(id);

    if (!user) {
        throw new Error("User not found.");
    }

    return sanitizeUser(user);
};

const createUser = async (userData) => {
    const existingUser = await userModel.findUserByEmail(userData.email);

    if (existingUser) {
        throw new Error("Email already exists.");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const userId = await userModel.createUser({
        first_name: userData.first_name,
        last_name: userData.last_name || null,
        email: userData.email,
        phone: userData.phone || null,
        password: hashedPassword,
        role: userData.role || "user",
        status: userData.status || "active",
        email_verified: userData.email_verified ? 1 : 0,
    });

    return await getUserById(userId);
};

const updateUserById = async (id, userData) => {
    const existingUser = await userModel.findUserById(id);

    if (!existingUser) {
        throw new Error("User not found.");
    }

    const allowedFields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "password",
        "role",
        "status",
        "email_verified",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(userData, field) && userData[field] !== undefined) {
            updateData[field] = userData[field];
        }
    });

    if (updateData.email) {
        const duplicate = await userModel.findUserByEmailExcludingId(updateData.email, id);

        if (duplicate) {
            throw new Error("Email already exists.");
        }
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "password")) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "email_verified")) {
        updateData.email_verified = updateData.email_verified ? 1 : 0;
    }

    const updated = await userModel.updateUserById(id, updateData);

    if (!updated) {
        throw new Error("No valid fields provided for update.");
    }

    return await getUserById(id);
};

const deleteUserById = async (id) => {
    const deleted = await userModel.deleteUserById(id);

    if (!deleted) {
        throw new Error("User not found.");
    }

    return true;
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUserById,
    deleteUserById,
};
