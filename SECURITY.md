# Security Policy

Security is part of the application's design and release process. This document
defines supported versions, coordinated disclosure, response targets, testing
boundaries, and deployment responsibilities.

## Supported versions

| Version | Security support |
| --- | --- |
| Latest `main` revision | Yes |
| Latest published release | Yes |
| Older releases, commits, and forks | No |

Fixes are developed privately when disclosure would increase risk, then applied
to `main` and the next appropriate release. Users should upgrade to the latest
published release; long-term support branches are not currently provided.

## Reporting a vulnerability

Do not open a public issue, discussion, pull request, or social-media post for a
suspected vulnerability. Submit a
[private GitHub security advisory](https://github.com/fatmakahveci/React-Django-Notes-App/security/advisories/new).

Include, when available:

- Affected version, commit, endpoint, component, and deployment assumptions
- Vulnerability class and expected security boundary
- Minimal reproduction steps or a proof of concept using fictional data
- Observed and expected behavior
- Impact on confidentiality, integrity, or availability
- Whether authentication, a specific role, or user interaction is required
- Suggested remediation or relevant standards

Do not include active credentials, production data, real personal information,
session cookies, JWTs, MFA secrets, Sentry DSNs, or scanner keys. If sensitive
material is required to reproduce the issue, ask for a secure exchange method
inside the private advisory first.

## Response targets

These are good-faith targets rather than contractual guarantees:

| Stage | Target |
| --- | --- |
| Acknowledge a complete report | 3 business days |
| Initial triage and severity assessment | 7 business days |
| Progress update while unresolved | At least every 14 days |
| Coordinated disclosure | After a fix or agreed mitigation is available |

Severity is assessed using exploitability, required privileges, affected data,
cross-user impact, deployment prevalence, and CVSS as supporting input. Remediation
time depends on severity, complexity, release safety, and reporter coordination.
Duplicate, incomplete, or non-security reports may be closed without this
cadence.

## Scope and testing rules

Useful reports include, but are not limited to:

- Authentication, token rotation, cookie, CSRF, or session-revocation failures
- Cross-user note access or insecure direct object references
- Administrator authorization, MFA bypass, or audit-log gaps
- Injection, unsafe deserialization, request smuggling, or sensitive data leaks
- Vulnerable dependencies with a reachable exploit path
- Container, cache, backup, restore, or deployment-profile weaknesses

The following are normally out of scope unless they demonstrate concrete
security impact:

- Automated scanner output without reproduction or reachability analysis
- Missing optional headers without an exploitable scenario
- Rate-limit observations that do not bypass authentication or authorization
- Self-XSS, social engineering, physical access, or compromised client devices
- Denial-of-service testing, traffic flooding, or resource exhaustion
- Findings only affecting unsupported versions or modified forks

Test only systems and accounts you own or have explicit permission to use. Do
not access another user's data, establish persistence, execute destructive
queries, degrade service, or exfiltrate more data than needed to demonstrate the
issue. Stop immediately if testing exposes secrets or third-party information.

## Safe harbor

Good-faith research that follows this policy, avoids privacy violations and
service disruption, and gives maintainers reasonable time to remediate will not
be intentionally pursued as malicious activity by this project. This statement
does not authorize testing of third-party infrastructure or override applicable
law. When uncertain, request permission through a private advisory before
continuing.

## Disclosure and credit

Coordinate public disclosure through the private advisory. Do not publish an
unpatched proof of concept or bypass before users can update. Reporter credit is
offered when requested and appropriate; anonymous reporting is respected.
Security release notes may limit exploit detail until adoption is sufficient.

## Secure deployment baseline

- Use `config.settings_production` for live traffic.
- Provide a unique random `DJANGO_SECRET_KEY` of at least 50 characters.
- Use supported PostgreSQL and Redis services with authentication, encryption,
  network isolation, least-privilege accounts, and backups.
- Restrict allowed hosts, CORS, and CSRF origins to exact deployment domains.
- Terminate TLS correctly and preserve production HTTPS redirects, Secure
  cookies, one-year HSTS, and preload only when every subdomain is HTTPS-ready.
- Set `APP_RELEASE` to an immutable commit or image identifier.
- Keep secrets in a deployment secret store; never bake them into images or
  commit them to the repository.
- Run dependency, static analysis, container, OpenAPI, and disaster-recovery
  checks before release.
- Apply edge connection and rate limits in addition to application throttling.
- Export logs and audit events to access-controlled, retention-managed storage.

See [the release runbook](docs/RELEASING.md) for the production gate and rollback
requirements.

## Authentication and session security

Notes require JWT authentication and are filtered by the active user before
retrieval or mutation. Access and refresh tokens are stored in HttpOnly cookies;
unsafe cookie-authenticated requests require CSRF validation. Access tokens
default to five minutes and refresh tokens to seven days. Refresh tokens rotate,
previous tokens are blacklisted, and password changes revoke issued sessions.

Increasing `JWT_ACCESS_TOKEN_MINUTES` or `JWT_REFRESH_TOKEN_DAYS` increases the
impact of token theft. Authentication responses must not be cached. Keep access
cookies scoped to `/api/` and refresh cookies to `/api/accounts/`. Maintain a
strict Content Security Policy at the serving edge because HttpOnly cookies do
not eliminate XSS risk.

## Administrator MFA and audit events

All Django admin sessions require a staff password and confirmed TOTP device.
Provision devices only from a trusted terminal. The enrollment URI contains a
secret and must not enter logs, tickets, screenshots, shell history, or source
control.

The application records admin password and MFA success/failure, logout,
enrollment, and create/update/delete operations. Audit events preserve actor,
target, changed-field metadata, source address, user agent, and time while
excluding passwords, OTPs, tokens, and TOTP secrets. The admin view is read-only,
but database operators remain privileged; export events to append-only storage
when stronger tamper resistance is required.

MFA recovery requires independent identity verification, revocation of the lost
device, replacement enrollment, and audit review. Do not add a temporary bypass
or share another administrator's device.

## Rate limits and authorized scanners

Application quotas separate anonymous, authenticated user, administrator,
credential, and approved scanner traffic. Multi-worker deployments require
shared Redis counters. Redis failure is surfaced rather than silently disabling
security throttles.

An authorized scanner may use `X-Security-Scanner-Key` only to select its quota;
the key never grants authentication or bypasses CSRF, authorization, ownership,
or MFA. Rotate it after access changes or suspected exposure. Set
`DJANGO_NUM_PROXIES` to the exact trusted proxy count and make the edge replace
untrusted forwarded-address headers.

## Logging, Sentry, and privacy

Structured logs and Sentry events may contain request IDs, internal user IDs,
environment, and release identifiers. They must not contain email addresses,
request bodies, authorization headers, cookies, passwords, JWTs, OTP values,
scanner keys, or TOTP secrets. Sentry default PII collection is disabled and
sensitive request headers are removed before transmission.

Restrict monitoring access, configure retention, and treat `SENTRY_DSN` as
deployment configuration. A request ID is a correlation value, not an
authentication credential, and must never authorize a request.

## Backup and incident readiness

Production backups must be encrypted, access-controlled, retained according to
policy, and routinely restored into an isolated environment. A successful
backup command alone is not recovery evidence. The repository's Disaster
Recovery Test validates `pg_dump`, clean-database `pg_restore`, password hashes,
TOTP devices, notes, and audit relationships using fictional data.

After suspected compromise, preserve evidence, restrict access, rotate affected
secrets, revoke sessions, review administrator audit events, determine data
impact, and follow applicable notification requirements. Do not destroy evidence
or silently reuse a compromised release tag.
