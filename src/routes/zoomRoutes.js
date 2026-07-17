const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/authMiddleware");
const zoomController = require("../controllers/zoomController");

router.post("/webhook", zoomController.handleZoomWebhook);
router.get("/circles/:id", authenticate, authenticate.isAdmin, zoomController.getCircleZoomOverview);
router.get("/circles/:id/logs", authenticate, authenticate.isAdmin, zoomController.getCircleZoomLogs);
router.post("/circles/:id/resync", authenticate, authenticate.isAdmin, zoomController.resyncCircleZoomSnapshots);

module.exports = router;
