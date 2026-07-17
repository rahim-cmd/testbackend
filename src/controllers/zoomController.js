const circleService = require("../services/circleService");
const zoomService = require("../services/zoomService");

const getCircleZoomOverview = async (req, res) => {
    try {
        const overview = await circleService.getCircleZoomOverview(req.params.id);

        if (!overview) {
            return res.status(404).json({
                success: false,
                message: "Circle not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: overview,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getCircleZoomLogs = async (req, res) => {
    try {
        const logs = await circleService.getCircleZoomLogs(req.params.id);

        if (!logs) {
            return res.status(404).json({
                success: false,
                message: "Circle not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: logs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const resyncCircleZoomSnapshots = async (req, res) => {
    try {
        const result = await circleService.resyncCircleZoomSnapshots(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Circle not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Zoom snapshots re-synced successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const handleZoomWebhook = async (req, res) => {
    try {
        const verification = zoomService.verifyZoomWebhookRequest(req);

        if (!verification.valid) {
            return res.status(401).json({
                success: false,
                message: "Invalid Zoom webhook signature.",
            });
        }

        if (req.body.event === "endpoint.url_validation") {
            return res.status(200).json(
                zoomService.buildWebhookValidationResponse(req.body.payload?.plainToken)
            );
        }

        const result = await circleService.handleZoomWebhookEvent(req.body);

        return res.status(200).json({
            success: true,
            message: "Webhook processed successfully.",
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getCircleZoomOverview,
    getCircleZoomLogs,
    resyncCircleZoomSnapshots,
    handleZoomWebhook,
};
