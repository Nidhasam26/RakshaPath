# RakshaPath Backend API Documentation

Base URL: `http://localhost:8000`  
Interactive OpenAPI UI: `http://localhost:8000/docs`

---

## System Endpoints

### 1. Root & Health Check
- `GET /`: Basic system status.
- `GET /health`: Comprehensive health check validating Database, PostGIS version, and Redis.

---

## Authentication & User Profile (`/auth`, `/me`)

### 1. Register User
`POST /auth/register` (also accepts `POST /register`)

**Request Body:**
```json
{
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "phone": "+919876543210",
  "password": "securepassword123",
  "role": "user"
}
```
*At least one of `email` or `phone` is required.*

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": "c1387d7b-967f-43fb-bd51-7871b933d325",
    "name": "Aarav Patel",
    "email": "aarav@example.com",
    "phone": "+919876543210",
    "role": "user",
    "push_token": null,
    "created_at": "2026-11-17T18:40:00Z"
  }
}
```

### 2. Login
`POST /auth/login` (also accepts `POST /login`)

**Request Body:**
```json
{
  "email": "aarav@example.com",
  "password": "securepassword123"
}
```
*(Or specify `"phone"` or `"identifier"`)*

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": { ... }
}
```

### 3. Forgot Password
`POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "aarav@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account matches that identifier, password reset instructions have been issued.",
  "reset_token": "..."
}
```

### 4. Reset Password
`POST /auth/reset-password`

**Request Body:**
```json
{
  "reset_token": "...",
  "new_password": "brandnewpassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password successfully reset. You may now log in with your new password."
}
```

### 5. Get Current User Profile
`GET /me` (also accepts `GET /auth/me`)

**Headers:**
`Authorization: Bearer <access_token>`

**Response (200 OK):**
```json
{
  "id": "c1387d7b-967f-43fb-bd51-7871b933d325",
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "phone": "+919876543210",
  "role": "user",
  "push_token": null,
  "created_at": "2026-11-17T18:40:00Z"
}
```

### 6. Update Current User Profile
`PUT /me` (also accepts `PUT /auth/me`)

**Headers:**
`Authorization: Bearer <access_token>`

**Request Body (Partial updates supported):**
```json
{
  "name": "Aarav P.",
  "push_token": "fcm_token_sample_123"
}
```

**Response (200 OK):**
Returns updated `UserResponse`.

