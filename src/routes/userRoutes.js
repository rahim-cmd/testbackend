const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const {
    adminCreateUserValidation,
    adminUpdateUserValidation,
} = require("../validators/userValidator");

router.use(authenticate, authenticate.isAdmin);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", adminCreateUserValidation, userController.createUser);
router.put("/:id", adminUpdateUserValidation, userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
