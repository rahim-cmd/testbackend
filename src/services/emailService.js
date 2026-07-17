const nodemailer = require("nodemailer");

const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
            user,
            pass,
        },
    });
};

const sendBookingStatusEmail = async ({
    to,
    userName,
    circleTitle,
    status,
    reason,
    zoomLink,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const subject = status === "approved"
        ? "Your circle booking has been approved"
        : "Your circle booking was not approved";

    const text = status === "approved"
        ? `Hi ${userName},\n\nYour booking for "${circleTitle}" has been approved.\n\nZoom link: ${zoomLink || "Not available yet."}`
        : `Hi ${userName},\n\nYour booking for "${circleTitle}" was not approved.\n\nReason: ${reason || "No reason provided."}`;

    const html = status === "approved"
        ? `<p>Hi ${userName},</p><p>Your booking for <strong>${circleTitle}</strong> has been approved.</p><p>Zoom link: <strong>${zoomLink || "Not available yet."}</strong></p>`
        : `<p>Hi ${userName},</p><p>Your booking for <strong>${circleTitle}</strong> was not approved.</p><p><strong>Reason:</strong> ${reason || "No reason provided."}</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Email sent successfully.",
    };
};

const sendZoomMeetingUpdateEmail = async ({
    to,
    userName,
    circleTitle,
    changeType,
    zoomLink,
    reason,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const subject = changeType === "removed"
        ? "Your circle meeting link is temporarily unavailable"
        : "Your circle meeting details were updated";

    const text = changeType === "removed"
        ? `Hi ${userName},\n\nThe meeting link for "${circleTitle}" is temporarily unavailable.${reason ? `\n\nReason: ${reason}` : ""}\n\nPlease check your dashboard later for the latest update.`
        : `Hi ${userName},\n\nThe meeting details for "${circleTitle}" were updated.${reason ? `\n\nReason: ${reason}` : ""}\n\nUse this latest Zoom link: ${zoomLink || "Not available yet."}`;

    const html = changeType === "removed"
        ? `<p>Hi ${userName},</p><p>The meeting link for <strong>${circleTitle}</strong> is temporarily unavailable.</p><p>${reason ? `<strong>Reason:</strong> ${reason}` : "Please check your dashboard later for the latest update."}</p>`
        : `<p>Hi ${userName},</p><p>The meeting details for <strong>${circleTitle}</strong> were updated.</p><p>${reason ? `<strong>Reason:</strong> ${reason}` : "Please use the latest link below."}</p><p>Zoom link: <strong>${zoomLink || "Not available yet."}</strong></p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Email sent successfully.",
    };
};

module.exports = {
    sendBookingStatusEmail,
    sendZoomMeetingUpdateEmail,
};
