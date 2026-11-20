# RakshaPath Backend Implementation Progress

## Rules & Principles
- **No Mock Data / No Seeds**: All tables start empty. Real API or live ingestion only.
- **Isolated Tests**: Mocked fixtures only (no live external API calls). Fast in-memory SQLite database for unit tests; PostGIS for geospatial tests.
- **Resilient Connectors**: Missing API keys report "not configured" and never crash the service.
- **Strict Folder Isolation**: All backend artifacts reside strictly inside `/backend/`.

---

## Step 1: Authentication & User Management (Complete)
- [x] **Alembic Migration 0002**: Added `email` (unique), `password_hash`, `role` (default 'user'), `reset_token`, and `reset_token_expires_at` to the `users` table; allowed `phone` to be optional for flexible registration.
- [x] **Password Hashing**: Cryptographically secure bcrypt hashing with 12 rounds in `app/core/security.py`.
- [x] **JWT Authentication**: HS256 JWT tokens with configurable expiration (24h default) issued at registration and login.
- [x] **CORS Configuration**: Configured in FastAPI middleware for `http://localhost:5173` (React Vite frontend) and `http://localhost:3000`.
- [x] **Endpoints Implemented**:
  - `POST /auth/register`: Create user account with name, email/phone, password, and optional role. Returns JWT token and user profile.
  - `POST /auth/login`: Authenticate with email or phone + password. Returns JWT token and user profile.
  - `POST /auth/forgot-password`: Generates a high-entropy 1-hour expiring reset token.
  - `POST /auth/reset-password`: Validates reset token and securely updates password.
  - `GET /me`: Returns authenticated profile using Bearer token dependency.
  - `PUT /me`: Updates name, email, phone, or push notification token.
- [x] **Automated Tests**: 14 tests in `tests/test_auth.py` covering registration, duplicate handling, login, token authentication, profile retrieval, profile updates, forgot/reset password lifecycle, and CORS headers.

