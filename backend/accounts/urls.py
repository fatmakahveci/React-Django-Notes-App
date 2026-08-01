from django.urls import path
from .views import (
    CookieTokenRefreshView,
    CsrfView,
    LogoutView,
    MyTokenObtainPairView,
    RegistrationView,
    SessionView,
)

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("token/", MyTokenObtainPairView.as_view(), name="token"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("session/", SessionView.as_view(), name="session"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("csrf/", CsrfView.as_view(), name="csrf"),
]
