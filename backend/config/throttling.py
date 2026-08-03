import secrets

from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


def is_security_scanner(request):
    """Recognize the configured scanner without granting it authorization."""
    configured_key = settings.SECURITY_SCANNER_KEY
    supplied_key = request.headers.get("X-Security-Scanner-Key", "")
    return bool(configured_key and supplied_key) and secrets.compare_digest(
        supplied_key, configured_key
    )


class RoleRateThrottle(SimpleRateThrottle):
    """Apply independent quotas to anonymous, user, admin, and scanner traffic."""

    scope = "anonymous"

    def allow_request(self, request, view):
        if is_security_scanner(request):
            self.scope = "security_scanner"
        elif request.user and request.user.is_authenticated:
            self.scope = "admin" if request.user.is_staff else "user"
        else:
            self.scope = "anonymous"

        self.rate = self.get_rate()
        self.num_requests, self.duration = self.parse_rate(self.rate)
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        if is_security_scanner(request):
            identity = self.get_ident(request)
        elif request.user and request.user.is_authenticated:
            identity = request.user.pk
        else:
            identity = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": identity}


class AuthenticationRateThrottle(SimpleRateThrottle):
    """Limit credential operations separately from the general API quota."""

    scope = "authentication"

    def get_cache_key(self, request, view):
        # Authorized scanners remain bounded by RoleRateThrottle but may exercise
        # authentication endpoints without distorting brute-force protection.
        if is_security_scanner(request):
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
