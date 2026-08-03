import json
import logging
import os
from contextvars import ContextVar
from datetime import datetime, timezone

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

request_id_context = ContextVar("request_id", default="")
user_id_context = ContextVar("user_id", default="")


class JSONFormatter(logging.Formatter):
    """Emit stable, single-line logs suitable for aggregation."""

    def format(self, record):
        from django.conf import settings

        request = getattr(record, "request", None)
        request_id = request_id_context.get() or getattr(request, "request_id", "")
        request_user = getattr(request, "user", None)
        user_id = user_id_context.get()
        if not user_id and getattr(request_user, "is_authenticated", False):
            user_id = str(request_user.pk)
        payload = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id or None,
            "user_id": user_id or None,
            "environment": getattr(settings, "ENVIRONMENT", "unknown"),
            "release": getattr(settings, "APP_RELEASE", "unknown"),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        for field in (
            "http_method",
            "http_path",
            "http_status",
            "duration_ms",
            "authenticated",
        ):
            if hasattr(record, field):
                payload[field] = getattr(record, field)
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def bind_user(user):
    user_id = str(user.pk) if getattr(user, "is_authenticated", False) else ""
    user_id_context.set(user_id)
    sentry_sdk.set_user({"id": user_id} if user_id else None)
    return user_id


def scrub_sentry_event(event, hint):
    request = event.get("request", {})
    headers = request.get("headers")
    if isinstance(headers, dict):
        sensitive = {"authorization", "cookie", "x-security-scanner-key"}
        request["headers"] = {
            key: value for key, value in headers.items() if key.lower() not in sensitive
        }
    request.pop("cookies", None)
    return event


def initialize_sentry(environment):
    dsn = os.getenv("SENTRY_DSN", "")
    if not dsn:
        return False
    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            DjangoIntegration(),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
        ],
        environment=environment,
        release=os.getenv("APP_RELEASE", "local"),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0")),
        send_default_pii=False,
        attach_stacktrace=True,
        before_send=scrub_sentry_event,
    )
    return True
