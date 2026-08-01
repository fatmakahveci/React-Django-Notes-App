# Development Guide

## Local development

The backend and frontend run as separate processes. Django uses port `8000` by
default, while Vite uses `5173`. Frontend API clients share the base URL defined
in `src/config.js`.

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

## Tests

Backend tests cover registration, cookie/CSRF-based JWT refresh, pagination,
search, note CRUD operations, and cross-user data isolation:

```bash
cd backend
python manage.py test
```

Frontend tests cover route protection, cookie sessions, title/body autosave,
search, pagination, and basic accessibility:

```bash
npm --prefix frontend test
npm --prefix frontend run build
```

Run coverage reports with enforced thresholds:

```bash
cd backend
pip install -r requirements-dev.txt
coverage run manage.py test
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

## Docker Compose

```bash
docker compose up --build
```

This starts PostgreSQL, the migration and Gunicorn backend process, and the
Nginx frontend in health-check order. Open `http://localhost:8080`. Compose is
configured for local HTTP; use the environment variables documented in the
README when deploying behind production TLS.

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
