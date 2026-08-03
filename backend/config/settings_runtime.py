import os
from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured


def require_runtime_environment(profile):
    required = (
        "DJANGO_SECRET_KEY",
        "DATABASE_URL",
        "DJANGO_CACHE_URL",
        "DJANGO_ALLOWED_HOSTS",
    )
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise ImproperlyConfigured(
            f"{profile} requires: {', '.join(missing)}."
        )

    secret = os.environ["DJANGO_SECRET_KEY"]
    if len(secret) < 50 or len(set(secret)) < 8:
        raise ImproperlyConfigured(
            f"{profile} requires a strong DJANGO_SECRET_KEY of at least 50 characters."
        )
    if urlparse(os.environ["DATABASE_URL"]).scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured(f"{profile} requires PostgreSQL DATABASE_URL.")
    if urlparse(os.environ["DJANGO_CACHE_URL"]).scheme not in {"redis", "rediss"}:
        raise ImproperlyConfigured(f"{profile} requires Redis DJANGO_CACHE_URL.")


def runtime_security(profile, *, hsts_seconds, include_subdomains, preload):
    require_runtime_environment(profile)
    return {
        "ENVIRONMENT": profile,
        "DEBUG": False,
        "SECRET_KEY": os.environ["DJANGO_SECRET_KEY"],
        "SECURE_SSL_REDIRECT": True,
        "SESSION_COOKIE_SECURE": True,
        "CSRF_COOKIE_SECURE": True,
        "JWT_COOKIE_SECURE": True,
        "SECURE_HSTS_SECONDS": hsts_seconds,
        "SECURE_HSTS_INCLUDE_SUBDOMAINS": include_subdomains,
        "SECURE_HSTS_PRELOAD": preload,
    }
