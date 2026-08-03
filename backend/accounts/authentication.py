from django.conf import settings
from rest_framework.authentication import CSRFCheck
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication
from config.observability import bind_user


def enforce_csrf(request):
    """Apply Django's CSRF validation to cookie-authenticated API requests."""
    check = CSRFCheck(lambda _request: None)
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    if reason:
        raise PermissionDenied(f"CSRF Failed: {reason}")


class CookieJWTAuthentication(JWTAuthentication):
    """Authenticate from an HttpOnly access cookie, with header fallback."""

    def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.JWT_ACCESS_COOKIE)
        if raw_token is None:
            return super().authenticate(request)

        validated_token = self.get_validated_token(raw_token.encode())
        if request.method not in {"GET", "HEAD", "OPTIONS", "TRACE"}:
            enforce_csrf(request)
        user = self.get_user(validated_token)
        bind_user(user)
        return user, validated_token
