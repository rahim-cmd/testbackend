const { validationResult } = require("express-validator");

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

  return res.status(200).json({
    success: true,
    message: "Validation Passed",
  });
};

module.exports = {
  register,
};
