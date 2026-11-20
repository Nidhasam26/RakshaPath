# RakshaPath Database Architecture

- Database: PostgreSQL with PostGIS extensions
- Migration tool: Alembic (`backend/alembic`)
- Policy: Zero mock/seed data. Tables start empty upon clean migration.

---

## Alembic Revisions

### 1. `0001_initial_schema`
Base schema providing:
- `users`: Core profile table (`id`, `name`, `phone`, `push_token`, `created_at`)
- `contacts`: Emergency contacts per user (`user_id`, `name`, `phone`, `type`)
- `hazards`: Geospatial hazards with PostGIS Geometry (SRID 4326), GiST spatial indexing
- `hazard_sources_log`: Audit log of ingestion runs
- `trips`: Trip records with PostGIS Linestring geometry and last location tracking
- `trip_locations`: Breadcrumb trail for trips
- `sos_alerts`: Emergency incidents
- `notifications_sent`: Push/SMS dispatch logs
- `operators`: Demonstration operator accounts
- `segment_risk`: ML / road segment risk scores with PostGIS geometry

### 2. `0002_user_auth`
Authentication extension to `users`:
- `email`: `VARCHAR(255)` UNIQUE, NULLABLE
- `password_hash`: `VARCHAR(255)` NOT NULL, hashed with bcrypt (cost factor 12)
- `role`: `VARCHAR(64)` NOT NULL, default `'user'`
- `reset_token`: `VARCHAR(255)` NULLABLE, indexed
- `reset_token_expires_at`: `TIMESTAMP` NULLABLE
- Altered `phone` column to be NULLABLE (allowing email-only or phone-only signups)

