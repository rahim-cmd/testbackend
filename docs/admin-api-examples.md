# AI Frontend Build Spec

Is file ko aap direct kisi AI tool me de sakte ho. Ye spec frontend generate karne ke liye optimized hai.

## Copy-Paste Prompt For AI

AI ko niche ka पूरा block exactly paste karein.

```text
START_PROMPT

You are building a production-quality frontend app for a backend that is already complete.

Goal:
Build a complete functional frontend with user and admin panels for circle booking platform.

Important constraints:
1) If a frontend project already exists, continue in existing stack and folder conventions.
2) If no frontend project exists, create React + Vite + JavaScript app with clean modular structure.
3) Use responsive UI for desktop and mobile.
4) Add route guards for unauthenticated and non-admin users.
5) Add proper loading, empty, error, and success states.
6) No fake backend data. Use real APIs listed below.

Backend base URL:
http://localhost:5000/api/v1

Auth header format for protected APIs:
Authorization: Bearer <token>

Standard API response patterns:
Success:
{
  "success": true,
  "message": "Optional",
  "data": {}
}

Validation Error:
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "email", "message": "Please enter a valid email address." }
  ]
}

General Error:
{
  "success": false,
  "message": "Error message"
}

Required pages:
1) Login page
2) Register page
3) Public upcoming circles page
4) User dashboard page (my bookings)
5) Admin dashboard landing page
6) Admin circles management page
7) Admin users management page
8) Admin bookings approval page

Required flows:
1) Register and login
2) Persist JWT (localStorage acceptable)
3) Role based redirect after login:
   - admin -> /admin
   - user -> /dashboard
4) User can view upcoming circles and create booking
5) User dashboard must show booking status and Zoom link only when approved
6) Admin can CRUD circles
7) Admin can CRUD users
8) Admin can approve/reject bookings
9) Admin can regenerate or remove a circle Zoom meeting link
10) User dashboard must reflect meeting link status changes automatically

API contracts:

Auth:
POST /auth/register
Body:
{
  "first_name": "Aisha",
  "last_name": "Khan",
  "email": "aisha@example.com",
  "phone": "+15550001234",
  "password": "StrongPass123"
}

POST /auth/login
Body:
{
  "email": "aisha@example.com",
  "password": "StrongPass123"
}

GET /auth/profile
POST /auth/logout

Public circles:
GET /circles/upcoming

User bookings:
POST /bookings
Body:
{
  "circle_id": 12
}

GET /bookings/my
Notes:
- API returns zoom_link only when booking_status = approved
- For pending/rejected/cancelled, zoom_link is null
- API also returns zoom_status and zoom_message for dashboard rendering

Expected dashboard-oriented fields from GET /bookings/my:
- booking_status
- notes
- approved_at
- zoom_meeting_id
- zoom_link
- zoom_start_time
- zoom_duration
- zoom_updated_at
- zoom_status
- zoom_message

PUT /bookings/:id/cancel

Admin circles:
GET /circles/admin
GET /circles/admin/:id
POST /circles/admin
Body:
{
  "title": "Cloud Architecture Circle",
  "description": "Weekly architecture deep dive.",
  "meeting_date": "2026-07-25",
  "start_time": "18:00:00",
  "end_time": "19:00:00",
  "max_members": 40,
  "host_name": "Admin Host"
}

PUT /circles/admin/:id
DELETE /circles/admin/:id
POST /circles/admin/:id/zoom/regenerate
DELETE /circles/admin/:id/zoom

Delete Zoom body:
{
  "reason": "Meeting link removed temporarily due to schedule change"
}

Important:
When admin creates circle without zoom_link, backend auto-generates Zoom meeting link.
Circle also stores Zoom metadata internally and approved bookings receive snapshot rows in zoom_meetings table.

Admin users:
GET /users
GET /users/:id
POST /users
PUT /users/:id
DELETE /users/:id

Admin bookings:
GET /bookings/admin
PUT /bookings/:id/approve
Body:
{
  "reason": "Approved by admin"
}

PUT /bookings/:id/reject
Body:
{
  "reason": "Circle capacity policy not met"
}

PUT /bookings/:id/status
Body:
{
  "status": "approved",
  "reason": "Manual override"
}

Zoom health check (admin utility):
GET /health/zoom

Admin Zoom overview:
GET /zoom/circles/:id

Admin Zoom logs:
GET /zoom/circles/:id/logs

Manual Zoom re-sync:
POST /zoom/circles/:id/resync

Response intention:
- circle level meeting info
- sync_summary for approved vs synced bookings
- booking level snapshot data for admin troubleshooting
- audit logs for admin visibility

Zoom webhook:
POST /zoom/webhook

Notes:
- This endpoint is for Zoom to call directly.
- It syncs meeting.updated and meeting.deleted changes back into backend data.
- If Zoom link changes or is removed directly in Zoom, user dashboard state and emails are updated by backend.

UI behavior requirements:
1) On user dashboard booking card:
   - approved + zoom_link exists -> show "Join Meeting" button
   - pending -> show "Waiting for admin approval"
   - rejected -> show "Rejected"
   - cancelled -> show "Cancelled"
  - zoom_status = updated -> show "Updated meeting link" indicator
  - zoom_status = unavailable -> show "Meeting link temporarily unavailable"
  - zoom_status = expired -> hide join button and show "Meeting completed" or "Link expired"
2) For approve/reject in admin bookings page, show confirmation modal.
3) Use toast/snackbar notifications for API results.
4) Disable submit buttons during API calls.
5) In admin circles page, add actions for "Regenerate Zoom Link" and "Remove Zoom Link".
6) If Zoom link is removed or updated, user dashboard should show latest zoom_status and zoom_message without frontend guessing.
7) In admin circle detail or admin circles table, add a "Zoom Details" view backed by GET /zoom/circles/:id.
8) In admin Zoom details view, add:
  - Re-sync button backed by POST /zoom/circles/:id/resync
  - Audit log list backed by GET /zoom/circles/:id/logs

Frontend architecture requirements:
1) Create centralized API client with interceptor for token.
2) Create auth store/context for user and role.
3) Create reusable components: DataTable, Modal, ConfirmDialog, StatusBadge, ProtectedRoute.
4) Keep endpoint paths/constants in one file.
5) Add clean folder structure and avoid very large files.

Acceptance criteria:
1) All listed pages are accessible and connected to real APIs.
2) Role-based routing works.
3) Admin can fully manage circles, users, bookings.
4) User sees zoom link only after approval.
5) User sees updated/unavailable/expired meeting states correctly.
6) Admin can regenerate/remove Zoom links from admin UI.
7) Error handling is visible and user friendly.
8) App runs locally without TypeScript or lint errors (based on chosen stack).

Output requirements from AI:
1) Create or update all needed frontend files.
2) Provide final list of created/updated files.
3) Provide run steps:
   - install
   - dev
   - build
4) Do not leave placeholders like TODO for core flows.

END_PROMPT
```

## Optional Note For You

Agar aap chahein to mai isi repo me ek aur short file bana doon jiska naam frontend-ai-prompt.txt ho, jise aap seedha copy-paste kar sake bina markdown formatting ke.
