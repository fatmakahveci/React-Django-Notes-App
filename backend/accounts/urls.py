from django.urls import path
from .views import (
    CookieTokenRefreshView,
    CsrfView,
    LogoutView,
    CookieTokenObtainPairView,
    PasswordPolicyView,
    RegistrationView,
    SessionView,
)

urlpatterns = [
    path("password-policy/", PasswordPolicyView.as_view(), name="password_policy"),
    path("register/", RegistrationView.as_view(), name="register"),
    path("token/", CookieTokenObtainPairView.as_view(), name="token"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("session/", SessionView.as_view(), name="session"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("csrf/", CsrfView.as_view(), name="csrf"),
]
