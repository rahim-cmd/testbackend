const { validationResult } = require("express-validator");
const authService = require("../services/authService");

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

module.exports = {
  register,
};
