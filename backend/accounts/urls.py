from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegistrationView, MyTokenObtainPairView

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("token/", MyTokenObtainPairView.as_view(), name="token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
