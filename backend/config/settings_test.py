from .settings import *  # noqa: F403
from .observability import initialize_sentry

ENVIRONMENT = "test"
DEBUG = False
SECRET_KEY = "test-only-secret-key-with-sufficient-length-never-use-in-production"  # nosec B105
SIMPLE_JWT = {**SIMPLE_JWT, "SIGNING_KEY": SECRET_KEY}  # noqa: F405
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
if not env_bool("DJANGO_TEST_USE_REDIS", False):  # noqa: F405
    CACHE_URL = ""
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "notes-test-cache",
            "TIMEOUT": CACHE_DEFAULT_TIMEOUT,  # noqa: F405
            "KEY_PREFIX": CACHE_KEY_PREFIX,  # noqa: F405
            "VERSION": CACHE_VERSION,  # noqa: F405
        }
    }
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
LOGGING["root"]["level"] = "WARNING"  # noqa: F405
LOGGING["loggers"]["django"]["level"] = "WARNING"  # noqa: F405
LOGGING["loggers"]["app.request"]["level"] = "WARNING"  # noqa: F405
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
JWT_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
initialize_sentry(ENVIRONMENT)
