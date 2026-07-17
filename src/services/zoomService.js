const https = require("https");
const crypto = require("crypto");

const ZOOM_TOKEN_HOST = "zoom.us";
const ZOOM_API_HOST = "api.zoom.us";

const toMysqlDateTime = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString().slice(0, 19).replace("T", " ");
};

const formatMeetingRecord = (meeting) => {
    return {
        meeting_id: meeting.id,
        topic: meeting.topic,
        join_url: meeting.join_url,
        start_url: meeting.start_url,
        password: meeting.password || null,
        start_time: toMysqlDateTime(meeting.start_time),
        duration: meeting.duration,
    };
};

const requestJson = ({ host, path, method, headers, body }) => {
    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                host,
                path,
                method,
                headers,
            },
            (res) => {
                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    let parsed;

                    try {
                        parsed = data ? JSON.parse(data) : {};
                    } catch (error) {
                        return reject(new Error("Failed to parse Zoom API response."));
                    }

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        return resolve(parsed);
                    }

                    return reject(
                        new Error(parsed?.message || "Zoom API request failed.")
                    );
                });
            }
        );

        req.on("error", (error) => reject(error));

        if (body) {
            req.write(body);
        }

        req.end();
    });
};

const assertZoomConfig = () => {
    if (!process.env.ZOOM_ACCOUNT_ID || !process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
        throw new Error("Zoom is not configured. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.");
    }
};

const getZoomAccessToken = async () => {
    assertZoomConfig();

    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const path = `/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;

    const response = await requestJson({
        host: ZOOM_TOKEN_HOST,
        path,
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    if (!response.access_token) {
        throw new Error("Unable to get Zoom access token.");
    }

    return response.access_token;
};

const toIsoDateTime = (meetingDate, startTime) => {
    const normalizedTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    return `${meetingDate}T${normalizedTime}`;
};

const toDurationMinutes = (startTime, endTime) => {
    const parseToMinutes = (value) => {
        const [h = "0", m = "0"] = value.split(":");
        return Number(h) * 60 + Number(m);
    };

    const start = parseToMinutes(startTime);
    const end = parseToMinutes(endTime);

    if (end > start) {
        return end - start;
    }

    return 60;
};

const buildMeetingPayload = ({ title, description, meeting_date, start_time, end_time }) => {
    return {
        topic: title,
        type: 2,
        agenda: description || undefined,
        start_time: toIsoDateTime(meeting_date, start_time),
        duration: toDurationMinutes(start_time, end_time),
        timezone: process.env.ZOOM_TIMEZONE || "UTC",
        settings: {
            join_before_host: false,
            waiting_room: true,
            approval_type: 2,
        },
    };
};

const getZoomMeeting = async (meetingId) => {
    const token = await getZoomAccessToken();

    return await requestJson({
        host: ZOOM_API_HOST,
        path: `/v2/meetings/${encodeURIComponent(meetingId)}`,
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
};

const createZoomMeeting = async ({ title, description, meeting_date, start_time, end_time }) => {
    const token = await getZoomAccessToken();
    const zoomUserId = process.env.ZOOM_USER_ID || "me";
    const payload = buildMeetingPayload({ title, description, meeting_date, start_time, end_time });

    const response = await requestJson({
        host: ZOOM_API_HOST,
        path: `/v2/users/${encodeURIComponent(zoomUserId)}/meetings`,
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.join_url) {
        throw new Error("Zoom meeting created but join link was not returned.");
    }

    return formatMeetingRecord(response);
};

const updateZoomMeeting = async (meetingId, meetingData) => {
    const token = await getZoomAccessToken();
    const payload = buildMeetingPayload(meetingData);

    await requestJson({
        host: ZOOM_API_HOST,
        path: `/v2/meetings/${encodeURIComponent(meetingId)}`,
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const updatedMeeting = await getZoomMeeting(meetingId);

    return formatMeetingRecord(updatedMeeting);
};

const deleteZoomMeeting = async (meetingId) => {
    if (!meetingId) {
        return;
    }

    try {
        const token = await getZoomAccessToken();

        await requestJson({
            host: ZOOM_API_HOST,
            path: `/v2/meetings/${encodeURIComponent(meetingId)}`,
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        if (error.message && /does not exist/i.test(error.message)) {
            return;
        }

        throw error;
    }
};

const validateZoomIntegration = async () => {
    const accessToken = await getZoomAccessToken();

    return {
        configured: true,
        tokenReceived: Boolean(accessToken),
    };
};

const verifyZoomWebhookRequest = (req) => {
    const secret = process.env.ZOOM_WEBHOOK_SECRET;

    if (!secret) {
        throw new Error("Zoom webhook secret is not configured.");
    }

    if (req.body?.event === "endpoint.url_validation") {
        return { valid: true };
    }

    const signature = req.headers["x-zm-signature"];
    const timestamp = req.headers["x-zm-request-timestamp"];
    const rawBody = req.rawBody || JSON.stringify(req.body || {});

    if (!signature || !timestamp) {
        return { valid: false };
    }

    const message = `v0:${timestamp}:${rawBody}`;
    const expectedSignature = `v0=${crypto
        .createHmac("sha256", secret)
        .update(message)
        .digest("hex")}`;

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(String(signature));

    if (expectedBuffer.length !== receivedBuffer.length) {
        return { valid: false };
    }

    return {
        valid: crypto.timingSafeEqual(expectedBuffer, receivedBuffer),
    };
};

const buildWebhookValidationResponse = (plainToken) => {
    if (!plainToken) {
        throw new Error("Zoom webhook validation token is missing.");
    }

    return {
        plainToken,
        encryptedToken: crypto
            .createHmac("sha256", process.env.ZOOM_WEBHOOK_SECRET)
            .update(plainToken)
            .digest("hex"),
    };
};

module.exports = {
    createZoomMeeting,
    updateZoomMeeting,
    deleteZoomMeeting,
    getZoomMeeting,
    validateZoomIntegration,
    verifyZoomWebhookRequest,
    buildWebhookValidationResponse,
};
