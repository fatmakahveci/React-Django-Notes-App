# React Django Notes App

A full-stack notes application with HttpOnly cookie-based JWT authentication and autosave. The frontend is built with React and Vite, while the REST API uses Django REST Framework.

## Features

- Registration and sign-in with email and password
- JWT access and refresh tokens stored in HttpOnly cookies with CSRF protection
- Private note listing, search, creation, editing, and deletion
- Autosave 700 ms after the user stops typing
- Automatic access-token refresh and failed-request replay
- Server-side data isolation between users
- Pagination, server-side search, and a responsive, accessible React interface

## Application demo

### 1. Create an account or sign in

Select **Create account** on the home page and enter an email address, username,
and password. Existing users can continue with **Sign in**. JWTs are never
exposed to JavaScript; the backend stores them in HttpOnly cookies.

| Home page | Sign-in page |
| --- | --- |
| ![Notes application home page](docs/images/demo-landing.png) | ![Notes application sign-in page](docs/images/demo-login.png) |

### 2. Find your notes or create a new one

After signing in, the application displays only your notes. The search field
performs server-side searches across titles and content. Use the blue button in
the lower-right corner to create a note. Long lists are paginated automatically.

![Example note list with search and new-note controls](docs/images/demo-notes.png)

### 3. Write and let autosave handle the rest

Open a note to edit its title and content directly. Changes are saved
automatically 700 ms after you stop typing. The back button returns to the note
list, while **Delete** permanently removes the note.

![Note editor with title and content fields](docs/images/demo-editor.png)

> Screenshots were captured from the local Docker Compose environment using
> demo data only.

## Technology

- Frontend: React 18, Wouter, Axios, Bootstrap, and Vite
- Backend: Django 5.2 LTS, Django REST Framework, and SimpleJWT
- Database: SQLite for local development; PostgreSQL for production and Docker Compose
- Testing: Vitest, Testing Library, Axe, Coverage.py, and Django's test runner

## Requirements

- Node.js 20.19 or later
- Python 3.11 or later
- npm 10 or later

Alternatively, Docker and Docker Compose are sufficient.

## One-command Docker setup

```bash
docker compose up --build
```

Open the application at `http://localhost:8080`. The API is available at
`http://127.0.0.1:8000`. Compose starts PostgreSQL, waits for the database,
applies migrations, and runs Django with Gunicorn. Stop the environment with:

```bash
docker compose down
```

This command preserves the PostgreSQL volume. The Compose defaults are intended
for local development only. In shared or production environments, provide strong
`POSTGRES_PASSWORD` and `DJANGO_SECRET_KEY` values through `.env`. Enable secure
cookies, HTTPS redirection, and HSTS behind a TLS-enabled reverse proxy.

## Manual quick start

```bash
git clone https://github.com/fatmakahveci/React-Django-Notes-App.git
cd React-Django-Notes-App
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

Start the frontend in a second terminal:

```bash
cd frontend
npm ci
npm start
```

The frontend runs at `http://localhost:5173`, and the API runs at
`http://127.0.0.1:8000`. On Windows PowerShell, activate the virtual environment
with `.venv\Scripts\Activate.ps1`.

## Environment variables

Supported values are documented in [.env.example](.env.example). Django reads
its configuration directly from the process environment:

```bash
export DJANGO_SECRET_KEY="replace-with-a-long-random-value"
export DJANGO_DEBUG=false
export DJANGO_ALLOWED_HOSTS="notes.example.com"
```

Create `frontend/.env.local` to change the frontend API address:

```dotenv
VITE_API_BASE_URL=https://api.example.com
```

`DJANGO_SECRET_KEY` is required when `DJANGO_DEBUG=false`. Add the frontend
origin to `DJANGO_CORS_ALLOWED_ORIGINS` and `DJANGO_CSRF_TRUSTED_ORIGINS`.
Production mode enables HTTPS redirection, secure cookies, and one-year HSTS by
default, so configure the reverse proxy and domain accordingly.

Configure production PostgreSQL with a standard URL:

```bash
export DATABASE_URL="postgresql://notes:password@db.example.com:5432/notes?sslmode=require"
```

SQLite is used when `DATABASE_URL` is not set.

## Commands

```bash
# Frontend — from the repository root
npm start
npm test
npm run build

# Backend — with the virtual environment active
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test

# Enforced coverage thresholds
coverage run manage.py test && coverage report
npm --prefix ../frontend run test:coverage
```

## Project structure

```text
backend/
  accounts/         user model, registration, and JWT endpoints
  notes/            private notes API
  config/           Django settings and root URL configuration
frontend/
  public/           static assets
  src/api/          cookie/CSRF-aware Axios clients and token refresh
  src/components/   shared interface components
  src/context/      authentication state
  src/pages/        page components
  src/__tests__/    frontend tests
docs/                detailed developer documentation
```

## Documentation

- [API reference](docs/API.md)
- [Development and verification guide](docs/DEVELOPMENT.md)
- [Security policy](SECURITY.md)

## License

This project is available under the [MIT License](LICENSE.md).
