from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema, inline_serializer

from .authentication import enforce_csrf
from .serializers import (
    CookieTokenRefreshSerializer,
    CustomUserSerializer,
    RegistrationSerializer,
)
from .password_policy import PASSWORD_POLICY
from config.throttling import AuthenticationRateThrottle, RoleRateThrottle
from config.exceptions import error_data


def prevent_caching(response):
    response["Cache-Control"] = "no-store"
    response["Pragma"] = "no-cache"
    return response


def set_auth_cookies(response, access, refresh=None):
    common = {
        "httponly": True,
        "secure": settings.JWT_COOKIE_SECURE,
        "samesite": settings.JWT_COOKIE_SAMESITE,
    }
    response.set_cookie(
        settings.JWT_ACCESS_COOKIE,
        access,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        path="/api/",
        **common,
    )
    if refresh:
        response.set_cookie(
            settings.JWT_REFRESH_COOKIE,
            refresh,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            path="/api/accounts/",
            **common,
        )
    prevent_caching(response)


def clear_auth_cookies(response):
    response.delete_cookie(settings.JWT_ACCESS_COOKIE, path="/api/")
    response.delete_cookie(settings.JWT_REFRESH_COOKIE, path="/api/accounts/")
    prevent_caching(response)


def authentication_failure(message):
    response = Response(
        error_data("authentication_required", message, status.HTTP_401_UNAUTHORIZED),
        status=status.HTTP_401_UNAUTHORIZED,
    )
    clear_auth_cookies(response)
    return response


class RegistrationView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegistrationSerializer
    throttle_classes = [RoleRateThrottle, AuthenticationRateThrottle]

    @extend_schema(auth=[])
    def create(self, request, *args, **kwargs):
        enforce_csrf(request)
        return prevent_caching(super().create(request, *args, **kwargs))


class PasswordPolicyView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        auth=[],
        responses=inline_serializer(
            name="PasswordPolicyResponse",
            fields={
                "min_length": serializers.IntegerField(),
                "max_length": serializers.IntegerField(),
                "require_lowercase": serializers.BooleanField(),
                "require_uppercase": serializers.BooleanField(),
                "require_digit": serializers.BooleanField(),
                "require_special": serializers.BooleanField(),
                "reject_common_passwords": serializers.BooleanField(),
                "reject_user_similarity": serializers.BooleanField(),
                "requirements": serializers.ListField(
                    child=serializers.CharField()
                ),
            },
        ),
    )
    def get(self, request):
        response = Response(PASSWORD_POLICY)
        response["Cache-Control"] = "public, max-age=3600"
        return response


class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer
    throttle_classes = [RoleRateThrottle, AuthenticationRateThrottle]

    @extend_schema(
        auth=[],
        responses=inline_serializer(
            name="AuthenticatedUserResponse",
            fields={"user": CustomUserSerializer()},
        ),
    )
    def post(self, request, *args, **kwargs):
        enforce_csrf(request)
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except AuthenticationFailed:
            return authentication_failure("Unable to sign in with the supplied credentials.")
        response = Response({"user": CustomUserSerializer(serializer.user).data})
        set_auth_cookies(
            response,
            serializer.validated_data["access"],
            serializer.validated_data["refresh"],
        )
        return response


class CookieTokenRefreshView(TokenRefreshView):
    serializer_class = CookieTokenRefreshSerializer
    throttle_classes = [RoleRateThrottle, AuthenticationRateThrottle]

    @extend_schema(
        auth=[],
        request=None,
        responses=inline_serializer(
            name="TokenRefreshResponse",
            fields={"authenticated": serializers.BooleanField()},
        ),
    )
    def post(self, request, *args, **kwargs):
        enforce_csrf(request)
        refresh = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if not refresh:
            return authentication_failure("Refresh token is missing or invalid.")

        serializer = self.get_serializer(data={"refresh": refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except (AuthenticationFailed, InvalidToken, TokenError):
            return authentication_failure("Refresh token is missing or invalid.")
        response = Response({"authenticated": True})
        set_auth_cookies(
            response,
            serializer.validated_data["access"],
            serializer.validated_data.get("refresh"),
        )
        return response


class SessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses=inline_serializer(
            name="SessionResponse",
            fields={"user": CustomUserSerializer()},
        )
    )
    def get(self, request):
        return prevent_caching(
            Response({"user": CustomUserSerializer(request.user).data})
        )


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(auth=[], request=None, responses={204: None})
    def post(self, request):
        enforce_csrf(request)
        refresh = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        auth=[],
        responses=inline_serializer(
            name="CsrfResponse",
            fields={"csrfToken": serializers.CharField()},
        ),
    )
    def get(self, request):
        return prevent_caching(Response({"csrfToken": get_token(request)}))
