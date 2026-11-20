# Running RakshaPath Backend Locally (Without Docker)

This guide walks you through setting up and running the RakshaPath FastAPI backend on Windows using a free cloud PostgreSQL database (Neon or Supabase). Docker is not required.

---

## 1. Create a Free PostgreSQL Database with PostGIS

We recommend **Neon** because it provides a free serverless PostgreSQL database with PostGIS support out of the box in 60 seconds.

### Steps on Neon:
1. Go to [https://neon.tech](https://neon.tech) and sign up (free, no credit card needed).
2. Click **Create Project**. Name it `rakshapath`.
3. In your project dashboard, navigate to the **SQL Editor** tab and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
   *(The backend also automatically enables PostGIS on startup if it's not enabled yet).*
4. On the Neon **Dashboard**, copy your **Connection string**. It looks like:
   ```
   postgresql://alex:AbCd1234EfGh@ep-cool-fog-123456.us-east-2.aws.neon.tech/rakshapath?sslmode=require
   ```

*(Alternative: You can also use [Supabase](https://supabase.com). Go to Project Settings -> Database -> Connection URI, and enable the PostGIS extension under Database -> Extensions).*

---

## 2. Configure Your Environment

1. Navigate to the `backend/` directory in PowerShell:
   ```powershell
   cd c:\Users\Dell\RakshaPath\backend
   ```
2. Copy `.env.example` to `.env` (if you haven't already):
   ```powershell
   Copy-Item .env.example .env
   ```
3. Open `backend/.env` in your text editor (VS Code, Notepad, etc.).
4. Paste your connection string into `DATABASE_URL`:
   ```ini
   DATABASE_URL=postgresql://alex:AbCd1234EfGh@ep-cool-fog-123456.us-east-2.aws.neon.tech/rakshapath?sslmode=require
   ```
   - Normal `postgres://` or `postgresql://` links with `?sslmode=require` are automatically converted by the backend to work with the PostgreSQL driver.
   - All other keys (`REDIS_URL`, API keys) are optional.

---

## 3. Run Setup & Start the Server

We have provided two automated PowerShell scripts inside `/backend`:

### First-Time Setup (`setup.ps1`):
Run this once to create the virtual environment, install all dependencies, and prepare `.env`:
```powershell
.\setup.ps1
```

### Start Backend (`run.ps1`):
Whenever you want to run the backend:
```powershell
.\run.ps1
```
What `run.ps1` does:
1. Automatically runs database migrations (`python -m alembic upgrade head`) to ensure all tables exist and stay up to date.
2. Starts the FastAPI server at [http://127.0.0.1:8000](http://127.0.0.1:8000) with hot-reload enabled.

---

## 4. Verify Everything Works

Once the server is running:

1. **Check System Health:**
   Open [http://localhost:8000/health](http://localhost:8000/health) in your browser.
   You will see:
   ```json
   {
     "status": "ok",
     "app": "RakshaPath",
     "environment": "development",
     "services": {
       "database": "ok",
       "postgis": "ok (3.4 ...)",
       "redis": "not_configured"
     }
   }
   ```
   As long as `database` is `"ok"`, the backend returns HTTP 200.

2. **Explore the Interactive API Docs:**
   Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
   Here you can test registering an account, logging in, requesting password resets, and managing your user profile.

---

## Troubleshooting

- **Error: "failed to resolve host 'db'"**:
  - The hostname `db` only works inside Docker. If you see this, make sure `DATABASE_URL` in `backend/.env` points to your cloud database URL (e.g., Neon or Supabase).
- **Error: "DATABASE_URL is not configured"**:
  - Open `backend/.env` and ensure `DATABASE_URL=...` is set.

