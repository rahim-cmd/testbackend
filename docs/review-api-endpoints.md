# Circle Meeting Review and Rating APIs

Base URL:
- /api/v1/reviews
- Legacy alias: /api/reviews

Auth:
- User token required for create, my list, and delete endpoints.
- Admin token required for moderation endpoints.
- Homepage listing is public, but returns only admin-approved public reviews.

## 1) Create or Update Review for a Joined Meeting

Method:
- POST /api/v1/reviews/bookings/:bookingId

Purpose:
- User submits rating/review for one booking.
- One user can have only one review per booking.
- Calling this endpoint again updates the existing review.
- Any create/update resets moderation status to pending for fresh admin approval.

Eligibility rules:
- Booking must belong to the logged-in user.
- Booking status must be approved.
- User must have a successful join_started log for that booking.

Request body:
{
  "rating": 5,
  "review_text": "Amazing circle, very practical and helpful.",
  "is_public": true
}

Response:
{
  "success": true,
  "message": "Review saved successfully.",
  "data": {
    "id": 12,
    "booking_id": 45,
    "circle_id": 10,
    "user_id": 7,
    "rating": 5,
    "review_text": "Amazing circle, very practical and helpful.",
    "is_public": 1,
    "review_status": "pending",
    "moderated_by_admin_id": null,
    "moderated_at": null,
    "moderation_note": null,
    "created_at": "2026-07-22T10:20:00.000Z",
    "updated_at": "2026-07-22T10:20:00.000Z"
  }
}

Validation errors:
- 422 if rating is invalid or user has not joined the meeting.
- 404 if booking not found for user.

## 2) Get My Reviews (Dashboard)

Method:
- GET /api/v1/reviews/me

Purpose:
- Fetch all reviews written by current user for dashboard history/edit UI.

Response:
{
  "success": true,
  "data": [
    {
      "id": 12,
      "booking_id": 45,
      "circle_id": 10,
      "rating": 5,
      "review_text": "Amazing circle, very practical and helpful.",
      "is_public": 1,
      "review_status": "approved",
      "moderated_by_admin_id": 2,
      "moderated_at": "2026-07-22T10:25:00.000Z",
      "moderation_note": "Good to publish.",
      "created_at": "2026-07-22T10:20:00.000Z",
      "updated_at": "2026-07-22T10:20:00.000Z",
      "circle_title": "Career Growth Circle",
      "meeting_date": "2026-07-20",
      "start_time": "19:00:00",
      "end_time": "20:00:00"
    }
  ]
}

## 3) Get Public Reviews for Homepage

Method:
- GET /api/v1/reviews/homepage?limit=12&circle_id=10

Query params:
- limit optional, default 12, min 1, max 100
- circle_id optional, filter by specific circle

Purpose:
- Returns only records where:
  - is_public = 1
  - review_status = approved

Response:
{
  "success": true,
  "data": [
    {
      "id": 12,
      "booking_id": 45,
      "circle_id": 10,
      "rating": 5,
      "review_text": "Amazing circle, very practical and helpful.",
      "created_at": "2026-07-22T10:20:00.000Z",
      "updated_at": "2026-07-22T10:20:00.000Z",
      "circle_title": "Career Growth Circle",
      "meeting_date": "2026-07-20",
      "first_name": "Aman",
      "last_name": "Khan",
      "reviewer_name": "Aman Khan"
    }
  ]
}

## 4) Admin Review Queue/List

Method:
- GET /api/v1/reviews/admin?status=pending&limit=50&circle_id=10

Auth:
- Admin token required.

Query params:
- status optional: pending | approved | rejected
- limit optional, default 50, max 200
- circle_id optional

Purpose:
- Fetch reviews for moderation dashboard with user/circle context.

Response:
{
  "success": true,
  "data": [
    {
      "id": 12,
      "booking_id": 45,
      "circle_id": 10,
      "user_id": 7,
      "rating": 5,
      "review_text": "Amazing circle, very practical and helpful.",
      "is_public": 1,
      "review_status": "pending",
      "moderated_by_admin_id": null,
      "moderated_at": null,
      "moderation_note": null,
      "first_name": "Aman",
      "last_name": "Khan",
      "email": "aman@example.com",
      "reviewer_name": "Aman Khan",
      "circle_title": "Career Growth Circle",
      "meeting_date": "2026-07-20"
    }
  ]
}

## 5) Admin Approve or Reject Review

Method:
- PUT /api/v1/reviews/:id/moderation

Auth:
- Admin token required.

Request body:
{
  "status": "approved",
  "note": "Looks good for homepage."
}

Request body for rejection:
{
  "status": "rejected",
  "note": "Contains policy-violating text."
}

Response:
{
  "success": true,
  "message": "Review approved successfully.",
  "data": {
    "id": 12,
    "review_status": "approved",
    "moderated_by_admin_id": 2,
    "moderated_at": "2026-07-23T09:10:00.000Z",
    "moderation_note": "Looks good for homepage."
  }
}

## 6) Delete My Review

Method:
- DELETE /api/v1/reviews/:id

Purpose:
- Allow user to remove their own review.

Response:
{
  "success": true,
  "message": "Review deleted successfully."
}

Errors:
- 404 if review does not belong to user or does not exist.

## Database Table Added

Table:
- booking_reviews

Columns:
- id (PK)
- booking_id
- circle_id
- user_id
- rating (1-5)
- review_text
- is_public
- review_status (pending, approved, rejected)
- moderated_by_admin_id
- moderated_at
- moderation_note
- created_at
- updated_at

Constraint:
- Unique per booking/user: (booking_id, user_id)

Notes:
- Table is auto-created and auto-updated at server startup through schema bootstrap.
- This keeps migration consistent with existing zoom and join-control bootstrap flow.
