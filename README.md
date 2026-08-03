# React Django Notes App

[![Fullstack CI](https://github.com/fatmakahveci/React-Django-Notes-App/actions/workflows/ci.yml/badge.svg)](https://github.com/fatmakahveci/React-Django-Notes-App/actions/workflows/ci.yml)
[![Disaster Recovery](https://github.com/fatmakahveci/React-Django-Notes-App/actions/workflows/disaster-recovery.yml/badge.svg)](https://github.com/fatmakahveci/React-Django-Notes-App/actions/workflows/disaster-recovery.yml)
[![Release](https://img.shields.io/github/v/release/fatmakahveci/React-Django-Notes-App?display_name=tag&sort=semver)](https://github.com/fatmakahveci/React-Django-Notes-App/releases)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE.md)

A production-minded notes application built with React and Django REST
Framework. It provides private, autosaving notes; HttpOnly cookie authentication;
administrator MFA; structured observability; and automated security, quality,
backup, and restore verification.

## Table of contents

- [Highlights](#highlights)
- [Demo](#demo)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Security model](#security-model)
- [Installation](#installation)
- [Administrator MFA](#administrator-mfa)
- [API](#api)
- [Testing and quality gates](#testing-and-quality-gates)
- [Release and deployment](#release-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [Contributing and security](#contributing-and-security)

## Highlights

- Registration and sign-in with a shared frontend/backend password policy
- Short-lived JWT access and rotating refresh tokens in HttpOnly cookies
- CSRF protection for every cookie-authenticated write
- Private note search, pagination, creation, autosave, and deletion
- Responsive UI tested at phone, tablet, and desktop viewports
- TOTP MFA and read-only audit events for Django administrator operations
- PostgreSQL production persistence and shared Redis rate-limit counters
- Request-correlated JSON logs and optional Sentry error monitoring
- OpenAPI contract checks, Lighthouse budgets, and dependency security audits
- Automated PostgreSQL backup-to-clean-restore disaster-recovery workflow

## Demo

### 1. Create an account or sign in

Open the landing page and select **Create account**. Registration validates the
password against the policy returned by the backend, keeping browser and API
rules synchronized. Existing users can select **Sign in**. Tokens are never
exposed to frontend JavaScript.

| Landing page | Sign-in page |
| --- | --- |
| ![Notes application landing page](docs/images/demo-landing.png) | ![Notes application sign-in form](docs/images/demo-login.png) |

### 2. Search and organize private notes

After authentication, the application returns only the active user's notes.
Search runs on the server across titles and content, results are ordered by the
latest update, and longer collections are paginated.

![Responsive note list with search and create controls](docs/images/demo-notes.png)

### 3. Write without a manual save step

Open a note and edit its title or content. Autosave runs 700 ms after typing
stops. A new note is created only after it contains content, and subsequent
saves update the same draft. The editor reports saving, saved, and failure
states through an accessible live region.

![Autosaving note editor](docs/images/demo-editor.png)

The landing page also serves an optimized product preview using 480, 768, and
1200 pixel WebP candidates, a PNG fallback, explicit dimensions, and
below-the-fold lazy loading. Screenshots contain fictional local demo data only.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite 7, Wouter, Axios |
| Backend | Python, Django 5.2 LTS, Django REST Framework |
| Authentication | Simple JWT, HttpOnly cookies, CSRF protection, TOTP MFA |
| Data | PostgreSQL 17, Redis 8 |
| Runtime | Gunicorn, unprivileged Nginx, Docker Compose |
| API contract | OpenAPI 3 and drf-spectacular |
| Testing | Django tests, Coverage.py, Vitest, Testing Library, axe-core, Lighthouse CI |
| Security and operations | pip-audit, npm audit, Trivy, Sentry, structured JSON logs |
| Delivery | GitHub Actions, Release Please, GHCR, provenance attestations |

## Architecture

```mermaid
flowchart LR
    Browser[React + Vite client] -->|HTTPS, HttpOnly JWT cookies, CSRF| API[Django REST API]
    Proxy[Nginx static server] --> Browser
    API -->|Users, notes, audit events| DB[(PostgreSQL)]
    API -->|Shared throttle counters| Cache[(Redis)]
    API -->|JSON logs, errors, traces| Obs[Sentry / log platform]
    Admin[Django Admin + TOTP MFA] --> API
    CI[GitHub Actions] -->|Tests, OpenAPI, Lighthouse, security| API
    CI -->|pg_dump and clean pg_restore| DB
```

The browser communicates with the API through a shared Axios client. Safe read
requests retry transient network and gateway failures; writes are never retried
automatically. Concurrent `401` responses share one refresh operation, and a
failed refresh clears the local session state.

The API authenticates access cookies, enforces CSRF for unsafe methods, restricts
note querysets to the current user, and returns a stable JSON error envelope.
PostgreSQL stores application and audit data. Redis provides consistent
rate-limit counters across Gunicorn workers. Every response carries an
`X-Request-ID`, which also appears with user ID, environment, and release in JSON
logs and Sentry events.

## Security model

- Access and rotating refresh tokens are stored in `HttpOnly` cookies and are
  unavailable to application JavaScript.
- Unsafe cookie-authenticated requests require a valid CSRF token.
- Login, registration, refresh, user, administrator, and approved security
  scanner traffic use separate rate-limit policies backed by Redis.
- Note querysets are scoped to the authenticated owner; cross-user reads,
  updates, and deletes return `404`.
- Administrator access requires a password and confirmed TOTP device, while
  security-sensitive actions are recorded in a read-only audit view.
- Staging and production reject weak secrets, non-PostgreSQL databases,
  non-Redis caches, or missing host configuration during startup.
- Production images are vulnerability-scanned, provenance-attested, immutable
  by commit SHA, non-root, read-only, and deployed only after approval.

Please report vulnerabilities privately according to [SECURITY.md](SECURITY.md).
Do not include credentials, personal data, or exploit details in a public issue.

### Runtime profiles

| Profile | Purpose | Persistence and security |
| --- | --- | --- |
| `config.settings_development` | Local server and default Compose setup | Local HTTP; SQLite/LocMem by default or explicitly configured PostgreSQL/Redis |
| `config.settings_test` | Unit, integration, and CI tests | In-memory SQLite, fast test hasher, optional Redis integration |
| `config.settings_staging` | Production-like validation | PostgreSQL and Redis required; HTTPS, secure cookies, one-day HSTS |
| `config.settings_production` | Live traffic | PostgreSQL and Redis required; HTTPS, secure cookies, one-year HSTS and preload |

Staging and production fail at startup unless a strong secret, PostgreSQL URL,
Redis URL, and explicit host list are present. Production security controls
cannot be disabled with environment toggles.

## Installation

### Prerequisites

Choose either:

- Docker Engine with Docker Compose v2; or
- Python 3.11+, Node.js 20.19+, and npm 10+

### Option A: Docker Compose

```bash
git clone https://github.com/fatmakahveci/React-Django-Notes-App.git
cd React-Django-Notes-App
docker compose up --build --wait
```

Open:

- Application: `http://localhost:8080`
- API: `http://127.0.0.1:8000`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`
- Django admin: `http://127.0.0.1:8000/admin/`

Compose starts PostgreSQL and ephemeral Redis, waits for their health checks,
applies migrations, and runs Django with Gunicorn. Follow logs with:

```bash
docker compose logs --follow backend frontend db redis
```

Stop containers while preserving PostgreSQL data:

```bash
docker compose down
```

`docker compose down --volumes` also deletes the local database volume. Use it
only when intentionally resetting disposable development data.

### Option B: Manual development setup

```bash
git clone https://github.com/fatmakahveci/React-Django-Notes-App.git
cd React-Django-Notes-App
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

On Windows PowerShell, activate with `.venv\Scripts\Activate.ps1`. Start the
frontend in a second terminal:

```bash
cd frontend
npm ci
npm start
```

The manual backend defaults to SQLite and process-local cache. The frontend runs
at `http://localhost:5173`; the API runs at `http://127.0.0.1:8000`.

### Environment configuration

Copy only the values needed for the selected profile from
[`.env.example`](.env.example). Do not commit a populated `.env` file.

For a staging or production deployment, provide at minimum:

```dotenv
DJANGO_SETTINGS_MODULE=config.settings_production
DJANGO_SECRET_KEY=replace-with-a-strong-random-value-of-at-least-50-characters
DJANGO_ALLOWED_HOSTS=notes.example.com
DATABASE_URL=postgresql://notes:password@db.example.com:5432/notes?sslmode=require
DJANGO_CACHE_URL=rediss://cache.example.com:6379/0
DJANGO_CORS_ALLOWED_ORIGINS=https://notes.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://notes.example.com
APP_RELEASE=immutable-commit-sha
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0
```

Set the frontend API location at build time:

```dotenv
VITE_API_BASE_URL=https://api.example.com
VITE_API_TIMEOUT_MS=10000
```

Use the staging Compose overlay only with real staging values:

```bash
docker compose -f compose.yaml -f compose.staging.yaml up --build --wait
```

Production releases are automated from Conventional Commits after `main` passes
CI. The workflow creates a release pull request and changelog, publishes scanned
and provenance-attested images to GHCR, then waits for approval in the protected
GitHub `production` environment. See the [release and deployment runbook](docs/RELEASING.md)
for repository secrets, server preparation, rollback behavior, and operations.

## Administrator MFA

Create a staff account, then provision its first TOTP device from a trusted
terminal:

```bash
cd backend
python manage.py createsuperuser
python manage.py provision_admin_mfa --email admin@example.com
```

Scan the displayed `otpauth://` URI immediately. It contains a secret and must
not be copied into logs, tickets, screenshots, or source control. Password-only
admin sessions are rejected. Login, MFA, logout, enrollment, and model mutation
events appear in the read-only **Audit events** admin view.

## API

The API uses JSON and a stable error envelope containing an error code, message,
HTTP status, field details where applicable, and request ID.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/accounts/password-policy/` | Retrieve the shared registration password contract |
| `POST` | `/api/accounts/register/` | Create an account |
| `POST` | `/api/accounts/token/` | Sign in and set authentication cookies |
| `POST` | `/api/accounts/token/refresh/` | Rotate the refresh token and renew the session |
| `POST` | `/api/accounts/logout/` | Revoke the refresh token and clear cookies |
| `GET` | `/api/accounts/session/` | Read the authenticated session |
| `GET/POST` | `/api/notes/` | Search, paginate, or create private notes |
| `GET/PATCH/DELETE` | `/api/notes/{id}/` | Read, update, or delete an owned note |
| `GET` | `/api/schema/` | Download the generated OpenAPI schema |

See [docs/API.md](docs/API.md) for authentication, pagination, throttling, error
examples, and the complete contract.

## Testing and quality gates

```bash
# Backend
cd backend
DJANGO_SETTINGS_MODULE=config.settings_test python manage.py test
DJANGO_SETTINGS_MODULE=config.settings_test coverage run manage.py test
coverage report
python manage.py makemigrations --check --dry-run

# Frontend, from the repository root
npm test
npm run build
npm --prefix frontend run test:coverage

# Production frontend quality budgets
cd frontend
npm run build
npm run lighthouse
```

CI enforces at least 90% backend coverage; frontend thresholds of 75% for lines
and statements, 70% for branches, and 65% for functions; and Lighthouse scores
of 90 performance, 100 accessibility, 95 best practices, and 100 SEO.

Pull requests also validate dependency vulnerabilities, the OpenAPI schema
against real endpoint behavior, production Compose configuration, release
metadata, and the deployment script. The scheduled disaster
recovery workflow backs up PostgreSQL, restores it into a clean database, and
verifies records and relationships.

## Release and deployment

The project follows [Semantic Versioning](https://semver.org/) and derives
release notes from Conventional Commits. After `main` passes CI, Release Please
opens or updates a release pull request. Merging that pull request creates the
version tag and GitHub Release, publishes scanned backend and frontend images to
GHCR, and waits for approval in the protected `production` environment.

Production uses the exact commit-SHA images built for the release, takes a
PostgreSQL backup before migration, runs migrations explicitly, waits for
container health checks, and verifies the public HTTPS endpoint. A failed
rollout restores the previous application images; database migrations are never
reversed automatically. See [docs/RELEASING.md](docs/RELEASING.md) for repository
settings, server configuration, rollback constraints, and operations.

## Troubleshooting

### Docker cannot connect to the daemon

Start Docker Desktop or the Docker service, then confirm `docker info` succeeds
before running Compose. A missing Docker socket is an environment problem, not a
Django migration failure.

### The backend remains unhealthy

```bash
docker compose ps
docker compose logs backend db redis
```

Confirm PostgreSQL and Redis are healthy before inspecting the backend. Check
that database credentials match on both the `db` and `backend` services. For
staging, confirm every required variable in `compose.staging.yaml` is defined.

### The browser reports CORS or CSRF errors

Add the exact frontend origin, including scheme and port, to both
`DJANGO_CORS_ALLOWED_ORIGINS` and `DJANGO_CSRF_TRUSTED_ORIGINS`. Do not use
wildcards with credentialed requests. Ensure the browser sends cookies and the
frontend API URL matches the backend origin.

### Local requests redirect repeatedly to HTTPS

Use `config.settings_development` for local HTTP. Staging and production always
redirect to HTTPS and must run behind a TLS-aware reverse proxy with trusted
forwarded-protocol configuration.

### Tests connect to a development or production database

Run tests with `DJANGO_SETTINGS_MODULE=config.settings_test`. That profile
forces in-memory SQLite regardless of `DATABASE_URL`. Set
`DJANGO_TEST_USE_REDIS=true` only when intentionally running Redis integration
tests.

### Requests unexpectedly return HTTP 429

Wait for the documented quota window to expire and identify the applicable
anonymous, user, admin, authentication, or scanner bucket. Multi-worker systems
must share Redis. For a deployment-wide logical invalidation, increment
`DJANGO_CACHE_VERSION`; never run `FLUSHDB` or wildcard deletion against shared
Redis.

### Admin login rejects a correct password

The admin requires a confirmed TOTP device. Provision one with
`provision_admin_mfa`, verify that the server clock is synchronized, and use the
current authenticator code. Recovery must revoke the lost device and enroll a
replacement; do not introduce an MFA bypass.

### A request failed but cannot be correlated in logs

Read `X-Request-ID` from the response and search the JSON logs or Sentry event
tags for that value. Confirm `APP_RELEASE` is set to the deployed commit or image
digest. Sentry remains disabled when `SENTRY_DSN` is empty.

### Migration state differs from the models

```bash
cd backend
python manage.py makemigrations --check --dry-run
python manage.py showmigrations
```

Create and review a migration instead of editing a production database schema
manually.

## Project structure

```text
backend/
  accounts/             users, authentication, MFA, and audit events
  notes/                private notes API and database models
  config/               settings profiles, middleware, errors, logging, and URLs
frontend/
  public/               static and responsive image assets
  src/api/              cookie/CSRF-aware Axios clients
  src/components/       shared layout and navigation
  src/context/          authentication state
  src/pages/            landing, authentication, list, and editor pages
  src/__tests__/        responsive, accessibility, API, and UI tests
.github/workflows/      CI, disaster recovery, release, and deployment automation
scripts/                guarded production deployment utilities
docs/                   API, development, release, and demo documentation
```

## Contributing and security

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening
a pull request, use Conventional Commit titles, add tests for behavior changes,
and ensure all quality gates pass. Use the private reporting process in
[SECURITY.md](SECURITY.md) for suspected vulnerabilities.

Additional documentation:

- [API reference](docs/API.md)
- [Development and verification guide](docs/DEVELOPMENT.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Release process](docs/RELEASING.md)
- [Changelog](CHANGELOG.md)

## License

Licensed under the [Apache License 2.0](LICENSE.md).
