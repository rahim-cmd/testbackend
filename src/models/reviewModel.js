const db = require("../config/db");

const getReviewEligibilityByBooking = async ({ bookingId, userId }) => {
    const [rows] = await db.execute(
        `SELECT
            b.id AS booking_id,
            b.circle_id,
            b.booking_status,
            EXISTS(
                SELECT 1
                FROM booking_join_logs bjl
                WHERE bjl.booking_id = b.id
                  AND bjl.user_id = ?
                  AND bjl.event_type = 'join_started'
                  AND bjl.status = 'success'
            ) AS has_joined
         FROM bookings b
         WHERE b.id = ?
           AND b.user_id = ?
         LIMIT 1`,
        [userId, bookingId, userId]
    );

    return rows[0];
};

const upsertReview = async ({ bookingId, circleId, userId, rating, reviewText, isPublic }) => {
    await db.execute(
        `INSERT INTO booking_reviews
            (booking_id, circle_id, user_id, rating, review_text, is_public, review_status, moderated_by_admin_id, moderated_at, moderation_note)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL)
         ON DUPLICATE KEY UPDATE
            rating = VALUES(rating),
            review_text = VALUES(review_text),
            is_public = VALUES(is_public),
            review_status = 'pending',
            moderated_by_admin_id = NULL,
            moderated_at = NULL,
            moderation_note = NULL,
            updated_at = CURRENT_TIMESTAMP`,
        [
            bookingId,
            circleId,
            userId,
            rating,
            reviewText || null,
            isPublic ? 1 : 0,
        ]
    );
};

const getReviewByBookingAndUser = async ({ bookingId, userId }) => {
    const [rows] = await db.execute(
        `SELECT
            id,
            booking_id,
            circle_id,
            user_id,
            rating,
            review_text,
            is_public,
                        review_status,
                        moderated_by_admin_id,
                        moderated_at,
                        moderation_note,
            created_at,
            updated_at
         FROM booking_reviews
         WHERE booking_id = ?
           AND user_id = ?
         LIMIT 1`,
        [bookingId, userId]
    );

    return rows[0];
};

const getMyReviews = async (userId) => {
    const [rows] = await db.execute(
        `SELECT
            br.id,
            br.booking_id,
            br.circle_id,
            br.rating,
            br.review_text,
            br.is_public,
            br.review_status,
            br.moderated_by_admin_id,
            br.moderated_at,
            br.moderation_note,
            br.created_at,
            br.updated_at,
            c.title AS circle_title,
            c.meeting_date,
            c.start_time,
            c.end_time
         FROM booking_reviews br
         INNER JOIN circle_events c ON c.id = br.circle_id
         WHERE br.user_id = ?
         ORDER BY br.updated_at DESC`,
        [userId]
    );

    return rows;
};

const getHomepageReviews = async ({ limit, circleId = null }) => {
    const queryParams = [];
    let whereClause = "WHERE br.is_public = 1 AND br.review_status = 'approved'";

    if (circleId) {
        whereClause += " AND br.circle_id = ?";
        queryParams.push(circleId);
    }

    queryParams.push(Number(limit));

    const [rows] = await db.execute(
        `SELECT
            br.id,
            br.booking_id,
            br.circle_id,
            br.rating,
            br.review_text,
            br.created_at,
            br.updated_at,
            c.title AS circle_title,
            c.meeting_date,
            u.first_name,
            u.last_name
         FROM booking_reviews br
         INNER JOIN users u ON u.id = br.user_id
         INNER JOIN circle_events c ON c.id = br.circle_id
         ${whereClause}
         ORDER BY br.updated_at DESC
         LIMIT ?`,
        queryParams
    );

    return rows;
};

const getApprovedReviews = async ({ limit, circleId = null }) => {
    const queryParams = [];
    let whereClause = "WHERE br.review_status = 'approved' AND br.is_public = 1";
    const parsedLimit = Number.isInteger(Number(limit))
        ? Math.min(Math.max(Number(limit), 1), 200)
        : 50;

    if (circleId !== null && circleId !== undefined) {
        whereClause += " AND br.circle_id = ?";
        queryParams.push(circleId);
    }

    const [rows] = await db.execute(
        `SELECT
            br.id,
            br.booking_id,
            br.circle_id,
            br.rating,
            br.review_text,
            br.is_public,
            br.review_status,
            br.created_at,
            br.updated_at,
            c.title AS circle_title,
            c.meeting_date,
            u.first_name,
            u.last_name
         FROM booking_reviews br
         INNER JOIN users u ON u.id = br.user_id
         INNER JOIN circle_events c ON c.id = br.circle_id
         ${whereClause}
         ORDER BY br.updated_at DESC
         LIMIT ${parsedLimit}`,
        queryParams
    );

    return rows;
};

const getMyReviewById = async ({ reviewId, userId }) => {
    const [rows] = await db.execute(
        `SELECT id
         FROM booking_reviews
         WHERE id = ?
           AND user_id = ?
         LIMIT 1`,
        [reviewId, userId]
    );

    return rows[0];
};

const getReviewById = async (reviewId) => {
    const [rows] = await db.execute(
        `SELECT
            br.id,
            br.booking_id,
            br.circle_id,
            br.user_id,
            br.rating,
            br.review_text,
            br.is_public,
            br.review_status,
            br.moderated_by_admin_id,
            br.moderated_at,
            br.moderation_note,
            br.created_at,
            br.updated_at,
            u.first_name,
            u.last_name,
            u.email,
            c.title AS circle_title,
            c.meeting_date
         FROM booking_reviews br
         INNER JOIN users u ON u.id = br.user_id
         INNER JOIN circle_events c ON c.id = br.circle_id
         WHERE br.id = ?
         LIMIT 1`,
        [reviewId]
    );

    return rows[0];
};

const getAdminReviews = async ({ status = null, circleId = null, limit = 50 }) => {
    const queryParams = [];
    const whereParts = [];
    const parsedLimit = Number.isInteger(Number(limit))
        ? Math.min(Math.max(Number(limit), 1), 200)
        : 50;

    if (status) {
        whereParts.push("br.review_status = ?");
        queryParams.push(status);
    }

    if (circleId !== null && circleId !== undefined) {
        whereParts.push("br.circle_id = ?");
        queryParams.push(circleId);
    }

    const whereClause = whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const [rows] = await db.execute(
        `SELECT
            br.id,
            br.booking_id,
            br.circle_id,
            br.user_id,
            br.rating,
            br.review_text,
            br.is_public,
            br.review_status,
            br.moderated_by_admin_id,
            br.moderated_at,
            br.moderation_note,
            br.created_at,
            br.updated_at,
            u.first_name,
            u.last_name,
            u.email,
            c.title AS circle_title,
            c.meeting_date
         FROM booking_reviews br
         INNER JOIN users u ON u.id = br.user_id
         INNER JOIN circle_events c ON c.id = br.circle_id
         ${whereClause}
         ORDER BY br.updated_at DESC
         LIMIT ${parsedLimit}`,
        queryParams
    );

    return rows;
};

const updateReviewModeration = async ({ reviewId, status, adminId, note }) => {
    const [result] = await db.execute(
        `UPDATE booking_reviews
         SET review_status = ?,
             moderated_by_admin_id = ?,
             moderated_at = NOW(),
             moderation_note = ?
         WHERE id = ?`,
        [status, adminId, note || null, reviewId]
    );

    return result.affectedRows;
};

const deleteMyReview = async ({ reviewId, userId }) => {
    const [result] = await db.execute(
        `DELETE FROM booking_reviews
         WHERE id = ?
           AND user_id = ?`,
        [reviewId, userId]
    );

    return result.affectedRows;
};

module.exports = {
    getReviewEligibilityByBooking,
    upsertReview,
    getReviewByBookingAndUser,
    getMyReviews,
    getHomepageReviews,
    getApprovedReviews,
    getMyReviewById,
    deleteMyReview,
    getReviewById,
    getAdminReviews,
    updateReviewModeration,
};
