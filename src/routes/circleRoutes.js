const express = require("express");

const router = express.Router();

const circleController = require("../controllers/circleController");
const authenticate = require("../middleware/authMiddleware");

router.post(

    "/",

    circleController.createCircle

);
router.get(
    "/upcoming",
    circleController.getUpcomingCircles
);

module.exports = router;