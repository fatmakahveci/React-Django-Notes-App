from .settings import *  # noqa: F403
from .settings_runtime import runtime_security
from .observability import initialize_sentry

globals().update(
    runtime_security(
        "production",
        hsts_seconds=31536000,
        include_subdomains=True,
        preload=True,
    )
)
initialize_sentry(ENVIRONMENT)
