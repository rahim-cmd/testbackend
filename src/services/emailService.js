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

const getAdminAlertEmail = () => {
    return process.env.ADMIN_ALERT_EMAIL || "hello.circlia@gmail.com";
};

const sendBookingStatusEmail = async ({
    to,
    userName,
    circleTitle,
    status,
    reason,
    dashboardUrl,
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
        ? `Hi ${userName},\n\nYour booking for "${circleTitle}" has been approved.\n\nPlease join the meeting only from your Circlia dashboard.${dashboardUrl ? `\n\nDashboard: ${dashboardUrl}` : ""}\n\nFor security, the Zoom link is not sent by email.`
        : `Hi ${userName},\n\nYour booking for "${circleTitle}" was not approved.\n\nReason: ${reason || "No reason provided."}`;

    const html = status === "approved"
        ? `<p>Hi ${userName},</p><p>Your booking for <strong>${circleTitle}</strong> has been approved.</p><p>Please join the meeting only from your Circlia dashboard.</p>${dashboardUrl ? `<p>Dashboard: <strong>${dashboardUrl}</strong></p>` : ""}<p>For security, the Zoom link is not sent by email.</p>`
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

const sendPasswordResetEmail = async ({
    to,
    userName,
    resetLink,
    otp,
    expiresInMinutes,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const subject = "Reset your password";

    const text = `Hi ${userName},\n\nWe received a request to reset your password.\n\nReset link: ${resetLink}\n\nOTP (optional verification): ${otp}\n\nThis link expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, you can ignore this email.`;

    const html = `<p>Hi ${userName},</p><p>We received a request to reset your password.</p><p><a href="${resetLink}">Click here to reset password</a></p><p><strong>OTP (optional verification):</strong> ${otp}</p><p>This link expires in <strong>${expiresInMinutes} minutes</strong>.</p><p>If you did not request this, you can ignore this email.</p>`;

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

const sendAdminRegistrationAlertEmail = async ({
    userName,
    userEmail,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const to = getAdminAlertEmail();
    const subject = "New user registration on Circlia";
    const text = `A new user has successfully registered on your website Circlia.\n\nName: ${userName}\nEmail: ${userEmail}`;
    const html = `<p>A new user has successfully registered on your website <strong>Circlia</strong>.</p><p><strong>Name:</strong> ${userName}<br/><strong>Email:</strong> ${userEmail}</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Admin registration alert sent successfully.",
    };
};

const sendAdminBookingAlertEmail = async ({
    circleTitle,
    userName,
    userEmail,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const to = getAdminAlertEmail();
    const subject = "New booking request on Circlia";
    const text = `Someone has booked the circle on your website Circlia.\n\nCircle: ${circleTitle}\nUser: ${userName}\nEmail: ${userEmail}`;
    const html = `<p>Someone has booked a circle on your website <strong>Circlia</strong>.</p><p><strong>Circle:</strong> ${circleTitle}<br/><strong>User:</strong> ${userName}<br/><strong>Email:</strong> ${userEmail}</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Admin booking alert sent successfully.",
    };
};

module.exports = {
    sendBookingStatusEmail,
    sendZoomMeetingUpdateEmail,
    sendPasswordResetEmail,
    sendAdminRegistrationAlertEmail,
    sendAdminBookingAlertEmail,
};
