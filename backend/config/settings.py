import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured
from django.core.management.utils import get_random_secret_key

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


def env_list(name, default=""):
    """Read a comma-separated environment variable as a clean list."""
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


def env_bool(name, default=False):
    """Read common truthy environment variable values as a boolean."""
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes"}


DEBUG = True
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY") or get_random_secret_key()
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

ENVIRONMENT = "base"
APP_RELEASE = os.getenv("APP_RELEASE", "local")
LOG_LEVEL = os.getenv("DJANGO_LOG_LEVEL", "INFO").upper()
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {"()": "config.observability.JSONFormatter"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "app.request": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_otp",
    "django_otp.plugins.otp_totp",
    "notes.apps.NotesConfig",
    "accounts.apps.AccountsConfig",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = env_list(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)

MIDDLEWARE = [
    "config.middleware.RequestContextMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django_otp.middleware.OTPMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

database_url = os.getenv("DATABASE_URL")
if database_url:
    parsed_database = urlparse(database_url)
    if parsed_database.scheme not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured("DATABASE_URL must use postgres:// or postgresql://")
    query_options = parse_qs(parsed_database.query)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": parsed_database.path.lstrip("/"),
            "USER": unquote(parsed_database.username or ""),
            "PASSWORD": unquote(parsed_database.password or ""),
            "HOST": parsed_database.hostname or "localhost",
            "PORT": parsed_database.port or 5432,
            "CONN_MAX_AGE": int(os.getenv("DATABASE_CONN_MAX_AGE", "60")),
            "OPTIONS": {
                "sslmode": query_options.get("sslmode", ["prefer"])[0],
            },
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Redis is optional for a single-process local server but required for shared,
# predictable rate-limit counters across production workers. Incrementing the
# version invalidates the namespace without an expensive Redis key scan.
CACHE_URL = os.getenv("DJANGO_CACHE_URL", "")
CACHE_KEY_PREFIX = os.getenv("DJANGO_CACHE_KEY_PREFIX", "notes")
CACHE_VERSION = int(os.getenv("DJANGO_CACHE_VERSION", "1"))
CACHE_DEFAULT_TIMEOUT = int(os.getenv("DJANGO_CACHE_DEFAULT_TIMEOUT", "300"))
if CACHE_VERSION < 1:
    raise ImproperlyConfigured("DJANGO_CACHE_VERSION must be a positive integer.")
if CACHE_DEFAULT_TIMEOUT < 1:
    raise ImproperlyConfigured(
        "DJANGO_CACHE_DEFAULT_TIMEOUT must be a positive integer."
    )

cache_options = {
    "TIMEOUT": CACHE_DEFAULT_TIMEOUT,
    "KEY_PREFIX": CACHE_KEY_PREFIX,
    "VERSION": CACHE_VERSION,
}
if CACHE_URL:
    if urlparse(CACHE_URL).scheme not in {"redis", "rediss"}:
        raise ImproperlyConfigured(
            "DJANGO_CACHE_URL must use the redis:// or rediss:// scheme."
        )
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": CACHE_URL,
            "OPTIONS": {
                "socket_connect_timeout": 2,
                "socket_timeout": 2,
                "retry_on_timeout": False,
                "health_check_interval": 30,
            },
            **cache_options,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "notes-local-cache",
            **cache_options,
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
]

# Password hashing
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]


# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "static"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.authentication.CookieJWTAuthentication",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "config.exceptions.api_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "config.throttling.RoleRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anonymous": os.getenv("DJANGO_RATE_LIMIT_ANONYMOUS", "60/minute"),
        "user": os.getenv("DJANGO_RATE_LIMIT_USER", "300/minute"),
        "admin": os.getenv("DJANGO_RATE_LIMIT_ADMIN", "600/minute"),
        "security_scanner": os.getenv(
            "DJANGO_RATE_LIMIT_SECURITY_SCANNER", "1200/minute"
        ),
        "authentication": os.getenv("DJANGO_RATE_LIMIT_AUTHENTICATION", "10/minute"),
    },
    # Trust no forwarded client addresses unless the exact proxy count is configured.
    "NUM_PROXIES": int(os.getenv("DJANGO_NUM_PROXIES", "0")),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "React Django Notes API",
    "DESCRIPTION": "Private notes API with HttpOnly cookie authentication.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# This key only selects a separate throttle bucket; it never grants API permissions.
SECURITY_SCANNER_KEY = os.getenv("DJANGO_SECURITY_SCANNER_KEY", "")

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_MINUTES", "5"))
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_DAYS", "7"))
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "CHECK_REVOKE_TOKEN": True,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "JWK_URL": None,
    "LEEWAY": 0,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",  # nosec B105: JWT claim name, not a secret
}

AUTH_USER_MODEL = "accounts.CustomUser"

AUTHENTICATION_BACKENDS = ("django.contrib.auth.backends.ModelBackend",)

JWT_ACCESS_COOKIE = "notes_access"
JWT_REFRESH_COOKIE = "notes_refresh"
JWT_COOKIE_SECURE = False
JWT_COOKIE_SAMESITE = os.getenv("JWT_COOKIE_SAMESITE", "Lax")
if JWT_COOKIE_SAMESITE not in {"Lax", "Strict", "None"}:
    raise ImproperlyConfigured("JWT_COOKIE_SAMESITE must be Lax, Strict, or None.")
if JWT_COOKIE_SAMESITE == "None" and not JWT_COOKIE_SECURE:
    raise ImproperlyConfigured("JWT_COOKIE_SECURE must be true when SameSite=None.")
