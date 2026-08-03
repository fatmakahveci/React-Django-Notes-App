# API Reference

Default base URL: `http://127.0.0.1:8000`

The machine-readable OpenAPI 3 schema is available at `GET /api/schema/`.
CI rejects schema warnings, validates the generated document, verifies that its
path and method inventory matches the Django routes, and validates real auth and
notes CRUD responses against their documented response schemas.

Request and response bodies use JSON. Access and refresh JWTs are stored in
HttpOnly cookies that are unavailable to JavaScript. Browser requests must send
cookies, and unsafe HTTP methods must include the CSRF header:

```http
Content-Type: application/json
X-CSRFToken: <csrftoken-cookie-value>
```

## Authentication

### Read the password policy

`GET /api/accounts/password-policy/`

Returns the machine-readable registration password contract, including minimum
and maximum length, required character classes, contextual common/similarity
checks, and display-ready requirements. Contextual checks remain server-side,
while the frontend applies the deterministic rules and displays the complete list.
Frontend validation consumes this endpoint directly; backend registration uses
the same policy object, so clients must not hard-code a separate password regex.

### Register a user

`POST /api/accounts/register/`

```json
{
  "email": "user@example.com",
  "user_name": "exampleuser",
  "password": "StrongPass1!",
  "match_password": "StrongPass1!"
}
```

A successful request returns the email and username with `201 Created`.
Passwords are never included in the response and must satisfy Django's active
password policy.

### Obtain a CSRF cookie

`GET /api/accounts/csrf/`

Call this endpoint before registration, sign-in, refresh, sign-out, or note
write operations. It returns the CSRF token and sets the `csrftoken` cookie.

### Sign in

`POST /api/accounts/token/`

```json
{
  "email": "user@example.com",
  "password": "StrongPass1!"
}
```

Example `200 OK` response:

```json
{
  "user": {
    "email": "user@example.com",
    "user_name": "exampleuser"
  }
}
```

Access and refresh tokens are not returned in the response body. They are
stored in the `notes_access` and `notes_refresh` HttpOnly cookies.

### Refresh the access token

`POST /api/accounts/token/refresh/`

Send an empty JSON body. A valid refresh cookie causes the access cookie to be
renewed and the refresh cookie to be rotated. The previous refresh token is
blacklisted immediately and cannot be replayed. Changing the account password
invalidates both existing access and refresh tokens.

### Read the current session

`GET /api/accounts/session/`

Returns the current user when the access cookie is valid.

### Sign out

`POST /api/accounts/logout/`

Blacklists the refresh token, clears both authentication cookies, and returns
`204 No Content`.

## Notes

Each note can be viewed or modified only by its owner. Detail requests using
another user's note ID return `404 Not Found`.

### List notes

`GET /api/notes/`

Returns a paginated response ordered from most recently updated to oldest.
Use `?page=2`, `?page_size=25` (maximum 100), and `?search=text` to search
titles and bodies.

```json
{
  "count": 24,
  "next": "http://127.0.0.1:8000/api/notes/?page=2",
  "previous": null,
  "results": []
}
```

### Create a note

`POST /api/notes/`

```json
{
  "title": "Shopping list",
  "body": "Milk, coffee, and bread"
}
```

`title` and `body` are optional. A successful request returns `201 Created`.

### Retrieve a note

`GET /api/notes/{id}/`

### Update a note

Use `PATCH /api/notes/{id}/` for partial updates:

```json
{
  "title": "Updated title",
  "body": "Updated content"
}
```

`PUT` is also supported when sending all editable fields.

### Delete a note

`DELETE /api/notes/{id}/`

A successful deletion returns an empty `204 No Content` response.

## Note response schema

```json
{
  "id": 1,
  "user": "exampleuser",
  "title": "Shopping list",
  "body": "Milk, coffee, and bread",
  "created": "2026-08-01T12:00:00Z",
  "updated": "2026-08-01T12:05:00Z"
}
```

`id`, `user`, `created`, and `updated` are read-only fields.

## Common errors

Every API failure uses the same envelope. Validation failures retain field-level
information in `details`; non-validation failures use `null` unless additional
machine-readable context is available:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed.",
    "status": 400,
    "details": {
      "email": ["Enter a valid email address."]
    }
  }
}
```

Clients should branch on `error.code`, display `error.message`, and use
`error.details` for individual form fields. Unexpected server failures use
`internal_server_error` without exposing exception messages or stack traces.

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Validation error or invalid request body |
| `401 Unauthorized` | Authentication cookie is missing, invalid, or expired |
| `403 Forbidden` | CSRF cookie or header is missing or invalid |
| `404 Not Found` | Resource does not exist or belongs to another user |
| `429 Too Many Requests` | The applicable request quota was exceeded; retry after the number of seconds in `Retry-After` |

## Rate limits

The API uses independent counters so one traffic class cannot exhaust another
class's quota. Defaults can be changed through environment variables:

| Traffic class | Default | Setting |
| --- | ---: | --- |
| Anonymous client, per source IP | 60/minute | `DJANGO_RATE_LIMIT_ANONYMOUS` |
| Authenticated user, per user ID | 300/minute | `DJANGO_RATE_LIMIT_USER` |
| Staff or superuser, per user ID | 600/minute | `DJANGO_RATE_LIMIT_ADMIN` |
| Authorized security scanner, per source IP | 1200/minute | `DJANGO_RATE_LIMIT_SECURITY_SCANNER` |
| Register, sign-in, and refresh, per source IP | 10/minute | `DJANGO_RATE_LIMIT_AUTHENTICATION` |

Authentication limits are applied in addition to the traffic-class limit. A
`429` response includes `Retry-After`. Configure a long random
`DJANGO_SECURITY_SCANNER_KEY` and send it as `X-Security-Scanner-Key` when an
authorized scanner needs its dedicated quota. The key only selects a throttle
bucket: it does not authenticate the scanner, bypass permissions, or grant
access to private notes. Never put this header value in scanner reports.

DRF throttling is defense in depth rather than complete denial-of-service
protection. Production deployments should also enforce connection and request
limits at the load balancer or reverse proxy. When the API runs on multiple
instances, configure Django with a shared cache so counters are consistent.
The default `DJANGO_NUM_PROXIES=0` ignores client-supplied forwarded addresses;
set it to the exact number of trusted reverse proxies so IP-based buckets use
the correct client address without allowing header spoofing.
