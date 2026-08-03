import logging
import re
import time
import uuid

import sentry_sdk

from .observability import bind_user, request_id_context, user_id_context

LOGGER = logging.getLogger("app.request")
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


class RequestContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        supplied_id = request.headers.get("X-Request-ID", "")
        request_id = (
            supplied_id if REQUEST_ID_PATTERN.fullmatch(supplied_id) else uuid.uuid4().hex
        )
        request.request_id = request_id
        request_token = request_id_context.set(request_id)
        user_token = user_id_context.set("")
        started = time.monotonic()

        with sentry_sdk.isolation_scope() as scope:
            scope.set_tag("request_id", request_id)
            try:
                response = self.get_response(request)
                user_id = bind_user(getattr(request, "user", None))
                response["X-Request-ID"] = request_id
                LOGGER.info(
                    "request_completed",
                    extra={
                        "http_method": request.method,
                        "http_path": request.path,
                        "http_status": response.status_code,
                        "duration_ms": round((time.monotonic() - started) * 1000, 2),
                        "authenticated": bool(user_id),
                    },
                )
                return response
            finally:
                user_id_context.reset(user_token)
                request_id_context.reset(request_token)
