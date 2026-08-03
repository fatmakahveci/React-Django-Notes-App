from .settings import *  # noqa: F403
from .settings_runtime import runtime_security
from .observability import initialize_sentry

globals().update(
    runtime_security(
        "staging",
        hsts_seconds=86400,
        include_subdomains=False,
        preload=False,
    )
)
initialize_sentry(ENVIRONMENT)
