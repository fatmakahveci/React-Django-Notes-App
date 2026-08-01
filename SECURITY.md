# Security Policy

## Supported version

Security updates are provided for the latest revision of the `main` branch.
Older commits and personal forks are not supported separately.

## Reporting a vulnerability

Do not disclose vulnerabilities through a public issue. Submit a
[private security advisory](https://github.com/fatmakahveci/React-Django-Notes-App/security/advisories/new)
with the following information:

- Affected endpoint, component, or commit
- Steps to reproduce the issue
- Expected and observed behavior
- Potential impact
- Example requests, responses, or suggested fixes when available

Do not include active access tokens, real user data, or secrets from running
systems while the report is being reviewed.

## Secure deployment requirements

- Set `DJANGO_DEBUG=false`.
- Provide a long, random `DJANGO_SECRET_KEY`.
- Restrict `DJANGO_ALLOWED_HOSTS`, CORS, and CSRF lists to real deployment domains.
- Serve all application and API traffic over HTTPS.
- Verify that every subdomain supports HTTPS before enabling HSTS preload.
- Never commit database passwords, tokens, or other secrets.
- Run dependency and static security scans regularly.

## Authentication notes

Note endpoints require JWT authentication and restrict all queries to the active
user. Access and refresh tokens are stored in Secure, HttpOnly cookies in
production and are never exposed to frontend JavaScript. Unsafe cookie-authenticated
requests require Django CSRF validation. Keep the frontend and API origin lists
strictly scoped, maintain a strong Content Security Policy, and treat XSS
prevention as a deployment requirement.
