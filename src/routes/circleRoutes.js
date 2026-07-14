const express = require("express");

const router = express.Router();

const circleController = require("../controllers/circleController");

router.post(

    "/",

    circleController.createCircle

);

module.exports = router;