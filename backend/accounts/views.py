from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .authentication import enforce_csrf
from .serializers import CustomUserSerializer, RegistrationSerializer


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


def clear_auth_cookies(response):
    response.delete_cookie(settings.JWT_ACCESS_COOKIE, path="/api/")
    response.delete_cookie(settings.JWT_REFRESH_COOKIE, path="/api/accounts/")


class RegistrationView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegistrationSerializer

    def create(self, request, *args, **kwargs):
        enforce_csrf(request)
        return super().create(request, *args, **kwargs)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["user_name"] = user.user_name
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        enforce_csrf(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response = Response({"user": CustomUserSerializer(serializer.user).data})
        set_auth_cookies(
            response,
            serializer.validated_data["access"],
            serializer.validated_data["refresh"],
        )
        return response


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        enforce_csrf(request)
        refresh = request.COOKIES.get(settings.JWT_REFRESH_COOKIE)
        if not refresh:
            return Response({"detail": "Refresh cookie is missing."}, status=401)

        serializer = self.get_serializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        response = Response({"authenticated": True})
        set_auth_cookies(
            response,
            serializer.validated_data["access"],
            serializer.validated_data.get("refresh"),
        )
        return response


class SessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"user": CustomUserSerializer(request.user).data})


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

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

    def get(self, request):
        return Response({"csrfToken": get_token(request)})
