# Release and Production Deployment

Releases are generated from Conventional Commits after `Fullstack CI` succeeds
on `main`. Release Please maintains the release pull request, Semantic Version,
`CHANGELOG.md`, Git tag, and GitHub Release. Merging normal feature pull requests
does not deploy production; merging the generated release pull request does.

## Commit convention

Use one of these prefixes in squash-merge titles:

| Prefix | Version impact | Changelog section |
| --- | --- | --- |
| `fix:` | Patch | Fixed |
| `feat:` | Minor | Added |
| `perf:` | Patch | Performance |
| `security:` | Patch | Security |
| `deps:` | Patch | Dependencies |
| `docs:` / `refactor:` | Patch | Documentation / Changed |
| `feat!:` or `BREAKING CHANGE:` | Major | Breaking changes |

`chore:`, `ci:`, and `test:` commits remain part of the Git history but are not
listed in release notes. Add `Release-As: 2.0.0` to a commit footer only when a
maintainer intentionally needs to override the calculated next version.

There is intentionally no hand-maintained `Unreleased` section. The open
Release Please pull request is the authoritative preview of unreleased changes,
which prevents the generated changelog and a manual list from diverging.

## One-time GitHub configuration

1. Allow GitHub Actions to create and approve pull requests under repository
   **Settings → Actions → General**.
2. Create a protected environment named `production`. Add at least one required
   reviewer, prevent self-review, restrict deployment to protected tags, and set
   a wait timer if your operational policy requires one.
3. Define environment variables:
   - `PRODUCTION_URL`: public HTTPS origin, without a trailing path.
   - `PRODUCTION_DEPLOY_PATH`: absolute server directory, for example
     `/srv/react-django-notes`.
4. Define environment secrets:
   - `PRODUCTION_HOST`
   - `PRODUCTION_USER`
   - `PRODUCTION_SSH_PRIVATE_KEY`: a dedicated, passphrase-free deployment key
     with access only to the deployment account.
   - `PRODUCTION_SSH_KNOWN_HOSTS`: the pinned server host-key line. Obtain and
     verify it out of band; never collect it dynamically in the workflow.
5. Protect `main`: require `Fullstack CI`, security workflows, review, resolved
   conversations, and linear history. Prevent tag deletion and modification for
   `v*` tags.

The server needs Docker Engine with Compose v2. The deployment user needs Docker
access and write access only to `PRODUCTION_DEPLOY_PATH`. GHCR packages must be
public, or the server must already be logged in with a read-only package token.

Create `PRODUCTION_DEPLOY_PATH/.env.production` on the server with mode `600`.
At minimum it must contain:

```dotenv
DJANGO_SECRET_KEY=a-strong-random-secret-at-least-50-characters-long
DATABASE_URL=postgresql://notes:strong-password@db:5432/notes
DJANGO_CACHE_URL=redis://redis:6379/0
DJANGO_ALLOWED_HOSTS=notes.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://notes.example.com
DJANGO_CORS_ALLOWED_ORIGINS=https://notes.example.com
POSTGRES_DB=notes
POSTGRES_USER=notes
POSTGRES_PASSWORD=a-different-strong-random-password
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.05
```

The file is server-owned configuration and must never be committed. TLS should
terminate at a trusted reverse proxy or load balancer in front of the Compose
services. Do not expose PostgreSQL, Redis, or Django directly to the internet.

## Automated release flow

1. A merge to `main` runs the full CI workflow.
2. A successful CI run triggers `Release and production deployment`.
3. Release Please creates or updates one release pull request containing the
   calculated version and changelog.
4. Review that pull request, especially migrations, configuration changes,
   security notes, and rollback compatibility.
5. Merging it reruns CI. Release Please then creates the immutable `vX.Y.Z` tag
   and GitHub Release.
6. Backend and frontend images are built once, tagged with the release and exact
   commit SHA, scanned by Trivy, published to GHCR, and supplied with GitHub
   provenance attestations. A HIGH or CRITICAL known vulnerability stops the
   deployment.
7. The `production` environment pauses the job for the configured approval.
8. Deployment pins the SHA-tagged images, takes a PostgreSQL backup, applies
   migrations explicitly, starts read-only/non-root containers, and verifies the
   public HTTPS health URL.

The workflow can be started manually for recovery of the release automation,
but it does not bypass release calculation, image scans, or environment approval.

## Rollback behavior

If pulling, migrating, starting, or health verification fails, the deployment
script restores the previous application image references. It intentionally does
not reverse database migrations. Application rollback is safe only when the new
schema remains compatible with the previous release.

Before approving a release with destructive or data-transforming migrations:

- Confirm the latest disaster-recovery workflow succeeded.
- Document a tested forward-fix or restore procedure.
- Increase the maintenance window if a lock or long-running backfill is possible.
- Retain the backup created under `backups/pre-vX.Y.Z-<timestamp>.dump` according
  to the organization's encrypted off-site retention policy.

To redeploy a previous compatible release, use its SHA-tagged images in a
reviewed production operation; never move or overwrite an existing release tag.

## Verification and incident handling

After deployment, verify login, token refresh, note CRUD, admin MFA, request IDs,
Sentry release context, error rate, latency, PostgreSQL, and Redis. Keep the
previous images until the observation window closes.

For a security release, use a private GitHub advisory until patched images are
available, rotate exposed credentials, invalidate affected sessions and cache
namespaces, and disclose only after remediation is deployable. Never attach
database dumps, `.env` files, tokens, or secret-bearing logs to a GitHub Release.
