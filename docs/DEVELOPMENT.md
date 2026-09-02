# Development Guide

## Local development

The backend and frontend run as separate processes. Django uses port `8000` by
default, while Vite uses `5173`. Frontend API clients share the base URL defined
in `src/config.js`.

`manage.py` defaults to `config.settings_development`. Tests and deployments
must select their profile explicitly; do not use the shared base
`config.settings` module as a runtime profile.

```bash
# Terminal 1
source .venv/bin/activate
cd backend
python manage.py runserver
```

```bash
# Terminal 2
cd frontend
npm start
```

## Database changes

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
python manage.py makemigrations --check --dry-run
```

The final command verifies that no unexpected migrations remain before a
commit.

## Disaster-recovery verification

The `Disaster Recovery Test` workflow creates representative user, note, TOTP,
and audit records in an isolated PostgreSQL database, produces a custom-format
backup, restores it into a separate empty database, and verifies record
relationships plus the password hash. It runs weekly, manually, and for pull
requests that change backend or recovery infrastructure.

The fixture command refuses to run unless
`DJANGO_ALLOW_DR_TEST_FIXTURE=true`; never set this variable in production. The
separate `DJANGO_DR_TEST_PASSWORD` value is required to verify password-hash
recovery and is never logged. The workflow uses only generated test data,
prints the backup SHA-256 digest, does
not upload the database artifact, and deletes its Compose volumes even after a
failure.

## Tests

Backend tests cover registration, cookie/CSRF-based JWT refresh, pagination,
search, note CRUD operations, and cross-user data isolation:

```bash
cd backend
DJANGO_SETTINGS_MODULE=config.settings_test python manage.py test
```

Frontend tests cover route protection, cookie sessions, title/body autosave,
search, pagination, and accessibility. The accessibility suite runs landing,
authentication, registration, and authenticated notes views at representative
phone (390×844), tablet (768×1024), and desktop (1440×900) viewports. Each
scenario validates semantic landmarks and interactive controls with axe-core:

```bash
npm --prefix frontend test
npm --prefix frontend run build
```

Landing-page screenshots use width-descriptor `srcset` candidates and explicit
intrinsic dimensions to avoid oversized downloads and layout shifts. Keep
below-the-fold images lazy-loaded with asynchronous decoding; do not apply lazy
loading to a page's likely largest-contentful-paint image.

Run coverage reports with enforced thresholds:

```bash
cd backend
pip install -r requirements-dev.txt
DJANGO_SETTINGS_MODULE=config.settings_test coverage run manage.py test
coverage report

cd ../frontend
npm run test:coverage
```

The backend requires at least 90% coverage. Frontend thresholds are 75% for
statements and lines, 70% for branches, and 65% for functions. CI runs the same
checks for every pull request and every push to `main`.

## Authentication flow

1. The client calls `/api/accounts/csrf/` to initialize the CSRF cookie.
2. After sign-in, the backend writes access and refresh JWTs to HttpOnly cookies.
3. Axios sends cookies with `withCredentials` and includes the CSRF header on write requests.
4. A `401` response triggers one refresh attempt using the refresh cookie.
5. The original request is replayed with the renewed access cookie.
6. If refresh fails, the client clears its session state. Tokens are never exposed to JavaScript.

## Admin MFA development workflow

The admin site rejects password-only staff sessions. Create a local staff user,
then enroll a TOTP device:

```bash
cd backend
python manage.py createsuperuser
python manage.py provision_admin_mfa --email admin@example.com --name primary
```

Scan the displayed URI immediately and avoid capturing it in terminal logs or
screenshots. The command refuses a duplicate device name. During an authorized
recovery, remove the lost device through a controlled database operation and
provision a replacement; do not implement a temporary MFA bypass.

Admin model registrations must use `AuditAdminMixin`. The dedicated admin site
automatically wraps registered mutable models, and the regression test fails if
a model can bypass create/update/delete auditing. Audit events are intentionally
read-only in the admin interface.

## Observability context

Every response includes `X-Request-ID`, and every application request log is a
single JSON object containing the same ID, authenticated user ID, environment,
and `APP_RELEASE`. Deployments should set `APP_RELEASE` to an immutable commit
SHA or image digest. Configure `SENTRY_DSN` only in the secret store and choose
`SENTRY_TRACES_SAMPLE_RATE` deliberately; `0` disables performance traces.

Sentry events use the same request, user, environment, and release context.
Default PII collection is disabled, and authorization, cookie, and scanner-key
headers are scrubbed. Never add request bodies, passwords, JWTs, OTP values, or
TOTP enrollment data to structured log extras or Sentry contexts.

## Frontend API policy

All Axios instances are created by `src/api/client.js`. Requests time out after
10 seconds by default; change this with `VITE_API_TIMEOUT_MS`. Network failures
and `502`, `503`, or `504` responses are retried at most twice only for
`GET`, `HEAD`, and `OPTIONS`. Write requests are never retried automatically,
which prevents duplicate note creation or deletion. Concurrent `401` responses
share one token-refresh request, and a failed refresh clears local session state
without issuing another logout request. UI code should use `normalizeApiError`
instead of reading Axios response shapes directly.

## Docker Compose

```bash
docker compose up --build
```

This starts PostgreSQL, an ephemeral Redis cache, the migration and Gunicorn backend process, and the
Nginx frontend in health-check order. Open `http://localhost:8080`. Compose is
configured for local HTTP; use the environment variables documented in the
README when deploying behind production TLS.

The local Django server uses an explicitly named in-process cache when
`DJANGO_CACHE_URL` is absent. Compose and production use Redis so throttle
counters are shared by every worker. Increment `DJANGO_CACHE_VERSION` for a
deployment-wide logical invalidation; never clear an entire shared Redis
database. Cache connection failures are surfaced instead of silently disabling
security throttles.

## Autosave flow

- Editor changes are saved after 700 ms without additional input.
- The first save on `/notes/new` creates a note.
- The returned ID is stored, and subsequent saves send `PATCH` requests to the same note.
- An empty new note is not created on the server.

## Change checklist

- New endpoints should require authentication by default.
- Note querysets must always be restricted by `request.user`.
- Passwords must be stored through the user manager, never written directly.
- Document new environment variables in `.env.example` and the README.
- Add backend or frontend tests for behavior changes.
- Run the production build, Django system check, and both test suites.
