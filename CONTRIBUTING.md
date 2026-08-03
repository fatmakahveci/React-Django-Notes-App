# Contributing

Thank you for improving React Django Notes App. Contributions should preserve
the project's security boundaries, test guarantees, and English-only public
interface and documentation.

## Before you start

- Search existing issues and pull requests to avoid duplicate work.
- Use a private security advisory instead of an issue for vulnerabilities; see
  [SECURITY.md](SECURITY.md).
- Open an issue before a large architectural change so its scope, migration
  strategy, and compatibility impact can be agreed upon.
- Keep pull requests focused. Separate unrelated refactors, dependency updates,
  and user-facing changes when they can be reviewed independently.

## Development setup

Follow the [README installation guide](README.md#installation). Local Django
commands use `config.settings_development`; automated tests must use
`config.settings_test`.

```bash
git clone https://github.com/fatmakahveci/React-Django-Notes-App.git
cd React-Django-Notes-App
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
npm --prefix frontend ci
```

Never copy production data, credentials, Sentry DSNs, MFA enrollment URIs, JWTs,
or security-scanner keys into a development environment.

## Branches and commits

Create a short-lived branch from the latest `main`:

```bash
git switch main
git pull --ff-only
git switch -c fix/concise-description
```

Use one of `feature/`, `fix/`, `security/`, `docs/`, `test/`, or `chore/` as the
branch prefix. Write imperative commit subjects under 72 characters. Conventional
Commit prefixes such as `feat:`, `fix:`, `security:`, `docs:`, and `test:` are
preferred because they make release notes easier to review.

Do not rewrite another contributor's branch or include generated build output,
coverage reports, local databases, `.env` files, or editor metadata.

## Engineering requirements

### Backend

- Require authentication by default for new endpoints.
- Restrict object querysets to the active user before retrieval or mutation.
- Preserve CSRF enforcement for cookie-authenticated unsafe requests.
- Use serializers and model managers for validation and password handling.
- Add migrations for model changes and verify that no migration is missing.
- Prevent N+1 queries and justify indexes using real filter/order patterns.
- Keep API errors inside the documented JSON envelope and update OpenAPI tests.
- Never log request bodies, passwords, tokens, cookies, OTP values, or secrets.

### Frontend

- Use the shared API client for timeout, retry, refresh, and error normalization.
- Never read authentication cookies or persist access/refresh tokens in browser
  storage.
- Keep controls keyboard accessible, labelled, and responsive at phone, tablet,
  and desktop widths.
- Add explicit image dimensions and responsive candidates; lazy-load only
  below-the-fold images.
- Preserve the enforced Lighthouse and coverage budgets.

### Documentation and dependencies

- Keep the site, API descriptions, log messages, and repository documentation
  in English.
- Document new environment variables in `.env.example` without real values.
- Pin Python runtime dependencies and commit npm lockfile changes.
- Explain dependency overrides and do not suppress an audit finding without a
  documented risk decision.

## Required verification

Run the checks relevant to the change before opening a pull request. For a
full-stack change, run all of them:

```bash
# Backend
cd backend
DJANGO_SETTINGS_MODULE=config.settings_test python manage.py test
DJANGO_SETTINGS_MODULE=config.settings_test coverage run manage.py test
coverage report
python manage.py makemigrations --check --dry-run
python manage.py spectacular --file /tmp/openapi.yaml --validate --fail-on-warn
python -m pip_audit -r requirements.txt
python -m bandit -q -r accounts config notes -x '*/migrations/*,*/tests.py,*/test_*.py'

# Frontend, from the repository root
npm --prefix frontend test
npm --prefix frontend run test:coverage
npm --prefix frontend run build
npm --prefix frontend audit --audit-level=high

# Run after user-visible or performance-sensitive frontend changes
cd frontend
npm run lighthouse
```

Changes to persistence, Docker, backup commands, or recovery fixtures must also
pass the **Disaster Recovery Test** workflow.

## Pull requests

Complete the pull request template with:

- The problem and user-visible outcome
- The implementation and important trade-offs
- Security, privacy, migration, and rollback impact
- Exact test commands and results
- Screenshots for visual changes at relevant viewport sizes
- Documentation and release-note updates

Reviewers may request a smaller scope, additional negative tests, query-count
evidence, accessibility verification, or a migration rollback plan. Resolve
review threads with code or a concrete explanation; do not mark unresolved risk
questions as complete.

By submitting a contribution, you confirm that you have the right to license it
under the repository's [MIT License](LICENSE.md).
