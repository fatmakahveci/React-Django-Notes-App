# API Reference

Default base URL: `http://127.0.0.1:8000`

Request and response bodies use JSON. Access and refresh JWTs are stored in
HttpOnly cookies that are unavailable to JavaScript. Browser requests must send
cookies, and unsafe HTTP methods must include the CSRF header:

```http
Content-Type: application/json
X-CSRFToken: <csrftoken-cookie-value>
```

## Authentication

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
renewed.

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

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Validation error or invalid request body |
| `401 Unauthorized` | Authentication cookie is missing, invalid, or expired |
| `403 Forbidden` | CSRF cookie or header is missing or invalid |
| `404 Not Found` | Resource does not exist or belongs to another user |
