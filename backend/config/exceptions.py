import logging

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

LOGGER = logging.getLogger(__name__)

STATUS_CODES = {
    400: "bad_request",
    401: "authentication_required",
    403: "permission_denied",
    404: "not_found",
    405: "method_not_allowed",
    406: "not_acceptable",
    415: "unsupported_media_type",
    429: "rate_limit_exceeded",
}


def error_data(code, message, status_code, details=None):
    return {
        "error": {
            "code": code,
            "message": message,
            "status": status_code,
            "details": details,
        }
    }


def _plain(value):
    if isinstance(value, dict):
        return {key: _plain(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_plain(item) for item in value]
    return str(value)


def api_exception_handler(exc, context):
    """Return every API failure using the application's stable error envelope."""
    response = exception_handler(exc, context)

    if response is None:
        LOGGER.exception("Unhandled API exception", exc_info=exc)
        return Response(
            error_data(
                "internal_server_error",
                "An unexpected error occurred.",
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            ),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    original_data = _plain(response.data)
    is_validation_error = isinstance(exc, ValidationError)
    if is_validation_error:
        code = "validation_error"
        message = "Request validation failed."
        details = original_data
    else:
        code = STATUS_CODES.get(response.status_code, "api_error")
        if isinstance(original_data, dict) and "detail" in original_data:
            message = original_data["detail"]
            details = {
                key: value for key, value in original_data.items() if key != "detail"
            } or None
        else:
            message = "The request could not be completed."
            details = original_data or None

    response.data = error_data(code, message, response.status_code, details)
    return response
