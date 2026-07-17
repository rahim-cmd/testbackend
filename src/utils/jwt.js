const jwt = require("jsonwebtoken");

const revokedTokens = new Set();

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    return process.env.JWT_SECRET;
};

const signToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || "7d") => {
    return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

const verifyToken = (token) => {
    if (revokedTokens.has(token)) {
        throw new Error("Token revoked");
    }

    return jwt.verify(token, getJwtSecret());
};

const revokeToken = (token) => {
    if (token) {
        revokedTokens.add(token);
    }
};

const isTokenRevoked = (token) => revokedTokens.has(token);

module.exports = {
    signToken,
    verifyToken,
    revokeToken,
    isTokenRevoked,
};
