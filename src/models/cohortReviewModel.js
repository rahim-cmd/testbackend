const db = require("../config/db");

const getEligibleMembership = async ({ cohortId, userId }) => {
    const [rows] = await db.execute(
        `SELECT id, cohort_id, user_id, status
         FROM cohort_members
         WHERE cohort_id = ?
           AND user_id = ?
         LIMIT 1`,
        [cohortId, userId]
    );

    return rows[0];
};

const upsertReview = async ({ cohortId, userId, rating, reviewText, isPublic }) => {
    await db.execute(
        `INSERT INTO cohort_reviews
            (cohort_id, user_id, rating, review_text, is_public, review_status, moderated_by_admin_id, moderated_at, moderation_note)
         VALUES (?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL)
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
            cohortId,
            userId,
            rating,
            reviewText || null,
            isPublic ? 1 : 0,
        ]
    );
};

const getReviewByCohortAndUser = async ({ cohortId, userId }) => {
    const [rows] = await db.execute(
        `SELECT
            id, cohort_id, user_id, rating, review_text, is_public,
            review_status, moderated_by_admin_id, moderated_at, moderation_note,
            created_at, updated_at
         FROM cohort_reviews
         WHERE cohort_id = ?
           AND user_id = ?
         LIMIT 1`,
        [cohortId, userId]
    );

    return rows[0];
};

const getMyReviews = async (userId) => {
    const [rows] = await db.execute(
        `SELECT
            cr.id, cr.cohort_id, cr.rating, cr.review_text, cr.is_public,
            cr.review_status, cr.moderated_by_admin_id, cr.moderated_at, cr.moderation_note,
            cr.created_at, cr.updated_at,
            c.title AS cohort_title
         FROM cohort_reviews cr
         LEFT JOIN cohorts c ON c.id = cr.cohort_id
         WHERE cr.user_id = ?
         ORDER BY cr.updated_at DESC`,
        [userId]
    );

    return rows;
};

const getHomepageReviews = async ({ limit, cohortId = null }) => {
    const queryParams = [];
    let whereClause = "WHERE cr.is_public = 1 AND cr.review_status = 'approved'";

    if (cohortId) {
        whereClause += " AND cr.cohort_id = ?";
        queryParams.push(cohortId);
    }

    queryParams.push(Number(limit));

    const [rows] = await db.execute(
        `SELECT
            cr.id, cr.cohort_id, cr.rating, cr.review_text, cr.created_at, cr.updated_at,
            c.title AS cohort_title,
            u.first_name, u.last_name
         FROM cohort_reviews cr
         LEFT JOIN users u ON u.id = cr.user_id
         LEFT JOIN cohorts c ON c.id = cr.cohort_id
         ${whereClause}
         ORDER BY cr.updated_at DESC
         LIMIT ?`,
        queryParams
    );

    return rows;
};

const getApprovedReviews = async ({ limit, cohortId = null }) => {
    const queryParams = [];
    let whereClause = "WHERE cr.review_status = 'approved'";
    const parsedLimit = Number.isInteger(Number(limit))
        ? Math.min(Math.max(Number(limit), 1), 200)
        : 50;

    if (cohortId !== null && cohortId !== undefined) {
        whereClause += " AND cr.cohort_id = ?";
        queryParams.push(cohortId);
    }

    const [rows] = await db.execute(
        `SELECT
            cr.id, cr.cohort_id, cr.rating, cr.review_text, cr.is_public,
            cr.review_status, cr.created_at, cr.updated_at,
            c.title AS cohort_title,
            u.first_name, u.last_name
         FROM cohort_reviews cr
         LEFT JOIN users u ON u.id = cr.user_id
         LEFT JOIN cohorts c ON c.id = cr.cohort_id
         ${whereClause}
         ORDER BY cr.updated_at DESC
         LIMIT ${parsedLimit}`,
        queryParams
    );

    return rows;
};

const getMyReviewById = async ({ reviewId, userId }) => {
    const [rows] = await db.execute(
        `SELECT id
         FROM cohort_reviews
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
            cr.id, cr.cohort_id, cr.user_id, cr.rating, cr.review_text, cr.is_public,
            cr.review_status, cr.moderated_by_admin_id, cr.moderated_at, cr.moderation_note,
            cr.created_at, cr.updated_at,
            u.first_name, u.last_name, u.email,
            c.title AS cohort_title
         FROM cohort_reviews cr
         LEFT JOIN users u ON u.id = cr.user_id
         LEFT JOIN cohorts c ON c.id = cr.cohort_id
         WHERE cr.id = ?
         LIMIT 1`,
        [reviewId]
    );

    return rows[0];
};

const getAdminReviews = async ({ status = null, cohortId = null, limit = 50 }) => {
    const queryParams = [];
    const whereParts = [];
    const parsedLimit = Number.isInteger(Number(limit))
        ? Math.min(Math.max(Number(limit), 1), 200)
        : 50;

    if (status) {
        whereParts.push("cr.review_status = ?");
        queryParams.push(status);
    }

    if (cohortId !== null && cohortId !== undefined) {
        whereParts.push("cr.cohort_id = ?");
        queryParams.push(cohortId);
    }

    const whereClause = whereParts.length > 0
        ? `WHERE ${whereParts.join(" AND ")}`
        : "";

    const [rows] = await db.execute(
        `SELECT
            cr.id, cr.cohort_id, cr.user_id, cr.rating, cr.review_text, cr.is_public,
            cr.review_status, cr.moderated_by_admin_id, cr.moderated_at, cr.moderation_note,
            cr.created_at, cr.updated_at,
            u.first_name, u.last_name, u.email,
            c.title AS cohort_title
         FROM cohort_reviews cr
         LEFT JOIN users u ON u.id = cr.user_id
         LEFT JOIN cohorts c ON c.id = cr.cohort_id
         ${whereClause}
         ORDER BY cr.updated_at DESC
         LIMIT ${parsedLimit}`,
        queryParams
    );

    return rows;
};

const updateReviewModeration = async ({ reviewId, status, adminId, note }) => {
    const [result] = await db.execute(
        `UPDATE cohort_reviews
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
        `DELETE FROM cohort_reviews
         WHERE id = ?
           AND user_id = ?`,
        [reviewId, userId]
    );

    return result.affectedRows;
};

module.exports = {
    getEligibleMembership,
    upsertReview,
    getReviewByCohortAndUser,
    getMyReviews,
    getHomepageReviews,
    getApprovedReviews,
    getMyReviewById,
    getReviewById,
    getAdminReviews,
    updateReviewModeration,
    deleteMyReview,
};
