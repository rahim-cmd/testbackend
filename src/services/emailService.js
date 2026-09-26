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

    // Security: never include the Zoom link in this email; users must join only from their dashboard.
    const text = changeType === "removed"
        ? `Hi ${userName},\n\nThe meeting link for "${circleTitle}" is temporarily unavailable.${reason ? `\n\nReason: ${reason}` : ""}\n\nPlease check your dashboard later for the latest update.`
        : `Hi ${userName},\n\nThe meeting details for "${circleTitle}" were updated.${reason ? `\n\nReason: ${reason}` : ""}\n\nPlease open your dashboard to view the latest meeting details and join link.`;

    const html = changeType === "removed"
        ? `<p>Hi ${userName},</p><p>The meeting link for <strong>${circleTitle}</strong> is temporarily unavailable.</p><p>${reason ? `<strong>Reason:</strong> ${reason}` : "Please check your dashboard later for the latest update."}</p>`
        : `<p>Hi ${userName},</p><p>The meeting details for <strong>${circleTitle}</strong> were updated.</p><p>${reason ? `<strong>Reason:</strong> ${reason}` : "Please open your dashboard to view the latest meeting details and join link."}</p>`;

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

const sendDirectZoomLinkEmail = async ({
    to,
    userName,
    sessionLabel,
    zoomLink,
    zoomPassword,
    adminNote,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const subject = `Your Zoom link for ${sessionLabel}`;
    const text = `Hi ${userName},\n\nAn admin has shared your Zoom link for "${sessionLabel}" directly with you.\n\nJoin link: ${zoomLink}${zoomPassword ? `\nPassword: ${zoomPassword}` : ""}${adminNote ? `\n\nNote: ${adminNote}` : ""}\n\nThis link was shared with you individually by the admin; it is not sent automatically for other sessions.`;
    const html = `<p>Hi ${userName},</p><p>An admin has shared your Zoom link for <strong>${sessionLabel}</strong> directly with you.</p><p><strong>Join link:</strong> ${zoomLink}${zoomPassword ? `<br/><strong>Password:</strong> ${zoomPassword}` : ""}</p>${adminNote ? `<p><strong>Note:</strong> ${adminNote}</p>` : ""}<p>This link was shared with you individually by the admin; it is not sent automatically for other sessions.</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Direct Zoom link email sent successfully.",
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

const sendAdminCallBookingAlertEmail = async ({
    name,
    email,
    phone,
    message,
    slotDate,
    dayOfWeek,
    startTime,
    endTime,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const to = getAdminAlertEmail();
    const subject = "New call request on Circlia";
    const text = `Someone has requested a call on your website Circlia.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nDate: ${dayOfWeek}, ${slotDate}\nTime: ${startTime} - ${endTime}\nMessage: ${message || "Not provided"}`;
    const html = `<p>Someone has requested a call on your website <strong>Circlia</strong>.</p><p><strong>Name:</strong> ${name}<br/><strong>Email:</strong> ${email}<br/><strong>Phone:</strong> ${phone || "Not provided"}<br/><strong>Date:</strong> ${dayOfWeek}, ${slotDate}<br/><strong>Time:</strong> ${startTime} - ${endTime}<br/><strong>Message:</strong> ${message || "Not provided"}</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Admin call booking alert sent successfully.",
    };
};

const sendCallBookingConfirmationEmail = async ({
    to,
    name,
    slotDate,
    dayOfWeek,
    startTime,
    endTime,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const subject = "Your call request has been received";
    const text = `Hi ${name},\n\nWe have received your call request for ${dayOfWeek}, ${slotDate} at ${startTime} - ${endTime}.\n\nOur team will reach out to you shortly to confirm.`;
    const html = `<p>Hi ${name},</p><p>We have received your call request for <strong>${dayOfWeek}, ${slotDate}</strong> at <strong>${startTime} - ${endTime}</strong>.</p><p>Our team will reach out to you shortly to confirm.</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Call booking confirmation email sent successfully.",
    };
};

const sendCallBookingStatusEmail = async ({
    to,
    name,
    slotDate,
    dayOfWeek,
    startTime,
    endTime,
    status,
    adminNote,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const subject = status === "confirmed"
        ? "Your call has been confirmed"
        : status === "cancelled"
            ? "Your call request was cancelled"
            : "Your call request status was updated";

    const text = `Hi ${name},\n\nYour call request for ${dayOfWeek}, ${slotDate} at ${startTime} - ${endTime} is now "${status}".${adminNote ? `\n\nNote: ${adminNote}` : ""}`;
    const html = `<p>Hi ${name},</p><p>Your call request for <strong>${dayOfWeek}, ${slotDate}</strong> at <strong>${startTime} - ${endTime}</strong> is now <strong>${status}</strong>.</p>${adminNote ? `<p><strong>Note:</strong> ${adminNote}</p>` : ""}`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Call booking status email sent successfully.",
    };
};

const sendAdminWaitlistAlertEmail = async ({
    name,
    email,
    phone,
    message,
    cohortTitle,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const to = getAdminAlertEmail();
    const subject = "New cohort waitlist signup on Circlia";
    const text = `Someone has joined the waitlist on your website Circlia.\n\nCohort: ${cohortTitle || "Next cohort"}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nMessage: ${message || "Not provided"}`;
    const html = `<p>Someone has joined the waitlist on your website <strong>Circlia</strong>.</p><p><strong>Cohort:</strong> ${cohortTitle || "Next cohort"}<br/><strong>Name:</strong> ${name}<br/><strong>Email:</strong> ${email}<br/><strong>Phone:</strong> ${phone || "Not provided"}<br/><strong>Message:</strong> ${message || "Not provided"}</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Admin waitlist alert sent successfully.",
    };
};

const sendWaitlistConfirmationEmail = async ({
    to,
    name,
    cohortTitle,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const subject = "You're on the waitlist";
    const text = `Hi ${name},\n\nThank you for joining the waitlist for "${cohortTitle || "our next cohort"}". We will reach out to you as soon as the next cohort is ready to start.`;
    const html = `<p>Hi ${name},</p><p>Thank you for joining the waitlist for <strong>${cohortTitle || "our next cohort"}</strong>. We will reach out to you as soon as the next cohort is ready to start.</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Waitlist confirmation email sent successfully.",
    };
};

const sendCohortEnrollmentEmail = async ({
    to,
    userName,
    cohortTitle,
}) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const subject = "You have been enrolled in the cohort";
    const text = `Hi ${userName},\n\nYou have been enrolled in "${cohortTitle}". Please log in to your dashboard to see your weekly session schedule and join links.\n\nFor security, Zoom links are only available from your dashboard.`;
    const html = `<p>Hi ${userName},</p><p>You have been enrolled in <strong>${cohortTitle}</strong>. Please log in to your dashboard to see your weekly session schedule and join links.</p><p>For security, Zoom links are only available from your dashboard.</p>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Cohort enrollment email sent successfully.",
    };
};

// Generic, form-agnostic admin notification. Used alongside (not instead of) the
// existing per-flow admin alert emails above, so it never changes their behavior.
// Any new user-facing form can call this with a form type + raw field data and get
// a consistently formatted "new submission" email with a subject specific to that form.
const FORM_SUBMISSION_SUBJECTS = {
    waitlist: "New user from waitlist form",
    contact: "New contact form submission",
    call_booking: "New call request from contact form",
    review: "New review submitted",
    cohort_review: "New review submitted for cohort",
    registration: "New user from registration form",
    booking: "New circle booking request",
};

const humanizeFieldKey = (key) => key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const sendAdminFormSubmissionAlert = async ({ formType, data }) => {
    const transporter = createTransporter();

    if (!transporter) {
        return {
            sent: false,
            message: "SMTP is not configured. Email was not sent.",
        };
    }

    const to = getAdminAlertEmail();
    const subject = FORM_SUBMISSION_SUBJECTS[formType] || "New form submission on Circlia";

    const entries = Object.entries(data || {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
    );

    const text = `${subject}\n\n${entries
        .map(([key, value]) => `${humanizeFieldKey(key)}: ${value}`)
        .join("\n")}`;

    const htmlRows = entries
        .map(
            ([key, value]) =>
                `<tr><td style="padding:4px 10px 4px 0;font-weight:bold;">${humanizeFieldKey(key)}</td><td style="padding:4px 0;">${value}</td></tr>`
        )
        .join("");

    const html = `<p><strong>${subject}</strong></p><table style="border-collapse:collapse;">${htmlRows}</table>`;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html,
    });

    return {
        sent: true,
        message: "Admin form submission alert sent successfully.",
    };
};

module.exports = {
    sendBookingStatusEmail,
    sendZoomMeetingUpdateEmail,
    sendDirectZoomLinkEmail,
    sendPasswordResetEmail,
    sendAdminRegistrationAlertEmail,
    sendAdminBookingAlertEmail,
    sendAdminCallBookingAlertEmail,
    sendCallBookingConfirmationEmail,
    sendCallBookingStatusEmail,
    sendAdminWaitlistAlertEmail,
    sendWaitlistConfirmationEmail,
    sendCohortEnrollmentEmail,
    sendAdminFormSubmissionAlert,
};
