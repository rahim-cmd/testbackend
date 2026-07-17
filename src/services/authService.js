const bcrypt = require("bcryptjs");

const userModel = require("../models/userModel");
const { signToken } = require("../utils/jwt");

const registerUser = async (userData) => {

    // Check existing email

    const existingUser = await userModel.findUserByEmail(userData.email);

    if (existingUser) {
        throw new Error("Email already exists.");
    }

    // Hash Password

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Prepare Data

    const newUser = {

        first_name: userData.first_name,

        last_name: userData.last_name || null,

        email: userData.email,

        phone: userData.phone || null,

        password: hashedPassword,

        role: "user",

        status: "active",

        email_verified: 0

    };

    // Insert User

    const userId = await userModel.createUser(newUser);

    // Generate JWT

    const token = signToken(
        {
            id: userId,
            email: newUser.email,
            role: newUser.role
        },
        process.env.JWT_EXPIRES_IN || "7d"
    );

    // Fetch User

    const user = await userModel.findUserById(userId);

    return {

        token,

        user

    };

};

const getProfile = async (userId) => {
    const user = await userModel.findUserById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    delete user.password;

    return user;
};

const loginUser = async (email, password) => {

    const user = await userModel.findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid email or password.");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password.");
    }

    if (user.status !== "active") {
        throw new Error("Your account is inactive.");
    }

    const token = signToken(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            type: "access"
        },
        process.env.JWT_EXPIRES_IN || "7d"
    );

    delete user.password;

    return {
        token,
        user
    };
};

module.exports = {

    registerUser,
    loginUser,
    getProfile

};