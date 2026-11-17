# Contributing to RakshaPath 🛡️

We follow strict engineering standards to ensure reliability, code quality, and alignment with the PRD scope levels.

---

## 1. Monorepo Folder Ownership

| Directory | Scope | Lead Focus |
| :--- | :--- | :--- |
| `/app` | Flutter Mobile Application (Android) | Mobile Engineer |
| `/dashboard` | React Police Operations Dashboard | Frontend Engineer |
| `/backend` | FastAPI API Server, Models, Endpoints | Backend Engineer |
| `/ml` | Road-risk models & News Extractor | ML Engineer |
| `/infra` | Docker, Postgres/PostGIS, Redis, CI/CD | DevOps Lead |
| `/docs` | Technical, Architecture, API, and Setup Docs | Shared Ownership |

---

## 2. Branch Naming Conventions

* `feature/L<level>-<short-description>` (e.g., `feature/L1-hazard-ingestion`)
* `fix/<short-description>` (e.g., `fix/postgis-srid-projection`)
* `docs/<short-description>` (e.g., `docs/api-spec-update`)

---

## 3. Commit Message Style (Conventional Commits)

Format: `<type>(<scope>): <subject>`

Examples:
* `feat(backend): implement GET /health verifying postgis and redis`
* `fix(app): prevent SOS sent indicator before delivery confirmation`
* `test(ingestion): add mocked fixtures for tomtom traffic connector`
* `docs(api): update /route response schema with safety score breakdown`

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`.

---

## 4. Pull Request & Review Rules

1. **Scope Level Adherence**: Do not submit PRs containing features outside the active scope level.
2. **Deterministic Tests**: Every new endpoint or ingestion connector must include tests using mock fixtures (no live API calls in CI).
3. **Spatial Queries**: All geo-distance checks must use PostGIS functions (`ST_DWithin`, `ST_Distance`).
4. **Synchronized Documentation**:
   * Any change to endpoints -> update `docs/API.md`.
   * Any change to data models -> update `docs/DATABASE.md`.
   * Any completed step -> update `docs/PROGRESS.md` and `README.md`.
