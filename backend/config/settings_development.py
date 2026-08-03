from .settings import *  # noqa: F403
from .observability import initialize_sentry

ENVIRONMENT = "development"
DEBUG = True
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
initialize_sentry(ENVIRONMENT)
