const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";

const { signToken, verifyToken, revokeToken, isTokenRevoked } = require("../src/utils/jwt");

test("revokeToken blocks a previously issued token", () => {
    const token = signToken({ id: 1, role: "user" });

    revokeToken(token);

    assert.equal(isTokenRevoked(token), true);
    assert.throws(() => verifyToken(token), /revoked/i);
});
