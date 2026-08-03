from django.http import JsonResponse
from django.views.defaults import (
    bad_request,
    page_not_found,
    permission_denied,
    server_error,
)

from config.exceptions import error_data


def bad_request_handler(request, exception):
    if request.path.startswith("/api/"):
        return JsonResponse(
            error_data("bad_request", "The API request could not be processed.", 400),
            status=400,
        )
    return bad_request(request, exception)


def permission_denied_handler(request, exception):
    if request.path.startswith("/api/"):
        return JsonResponse(
            error_data(
                "permission_denied", "You do not have permission to perform this action.", 403
            ),
            status=403,
        )
    return permission_denied(request, exception)


def page_not_found_handler(request, exception):
    if request.path.startswith("/api/"):
        return JsonResponse(
            error_data("not_found", "The requested API endpoint was not found.", 404),
            status=404,
        )
    return page_not_found(request, exception)


def server_error_handler(request):
    if request.path.startswith("/api/"):
        return JsonResponse(
            error_data(
                "internal_server_error", "An unexpected error occurred.", 500
            ),
            status=500,
        )
    return server_error(request)
