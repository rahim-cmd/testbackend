const express = require("express");

const router = express.Router();

const circleController = require("../controllers/circleController");
const authenticate = require("../middleware/authMiddleware");
const { circleCreateValidation, circleUpdateValidation } = require("../validators/circleValidator");

router.post(
    "/",
    authenticate,
    circleCreateValidation,
    circleController.createCircle
);

router.get(
    "/upcoming",
    circleController.getUpcomingCircles
);

router.get(
    "/admin",
    authenticate,
    authenticate.isAdmin,
    circleController.getAllCircles
);

router.get(
    "/admin/:id",
    authenticate,
    authenticate.isAdmin,
    circleController.getCircleById
);

router.post(
    "/admin",
    authenticate,
    authenticate.isAdmin,
    circleCreateValidation,
    circleController.createCircle
);

router.put(
    "/admin/:id",
    authenticate,
    authenticate.isAdmin,
    circleUpdateValidation,
    circleController.adminUpdateCircle
);

router.delete(
    "/admin/:id",
    authenticate,
    authenticate.isAdmin,
    circleController.adminDeleteCircle
);

router.post(
    "/admin/:id/zoom/regenerate",
    authenticate,
    authenticate.isAdmin,
    circleController.adminRegenerateCircleZoom
);

router.delete(
    "/admin/:id/zoom",
    authenticate,
    authenticate.isAdmin,
    circleController.adminDeleteCircleZoom
);

router.put(
    "/:id",
    authenticate,
    circleUpdateValidation,
    circleController.updateCircle
);

router.delete(
    "/:id",
    authenticate,
    circleController.deleteCircle
);

module.exports = router;