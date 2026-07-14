const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userModel = require("../models/userModel");

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

    const token = jwt.sign(

        {
            id: userId,
            email: newUser.email,
            role: newUser.role
        },

        process.env.JWT_SECRET,

        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }

    );

    // Fetch User

    const user = await userModel.findUserById(userId);

    return {

        token,

        user

    };

};

module.exports = {

    registerUser

};