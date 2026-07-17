const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const { validateZoomIntegration } = require("../services/zoomService");

const router = express.Router();

router.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        message: "Circlia Backend Running Successfully",

        version: "1.0.0"

    });

});

router.get("/zoom", authenticate, authenticate.isAdmin, async (req, res) => {
    try {
        const result = await validateZoomIntegration();

        return res.status(200).json({
            success: true,
            message: "Zoom integration is healthy.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
            data: {
                configured: false,
                tokenReceived: false,
            },
        });
    }
});

module.exports = router;