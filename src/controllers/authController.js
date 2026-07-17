const { validationResult } = require("express-validator");
const authService = require("../services/authService");
const { revokeToken } = require("../utils/jwt");

const getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      revokeToken(token);
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const register = async (req, res) => {
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

    const result = await authService.registerUser(req.body);

    return res.status(201).json({

        success: true,

        message: "Registration successful.",

        data: result

    });

} catch (error) {

    return res.status(400).json({

        success: false,

        message: error.message

    });

}

};

const login = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(422).json({

            success: false,

            message: "Validation failed.",

            errors: errors.array()

        });

    }

    try {

        const result = await authService.loginUser(
            req.body.email,
            req.body.password
        );

        return res.status(200).json({

            success: true,

            message: "Login successful.",

            data: result

        });

    } catch (error) {

        return res.status(401).json({

            success: false,

            message: error.message

        });

    }

};

module.exports = {
  register,
  login,
  getProfile,
  logout,
};
