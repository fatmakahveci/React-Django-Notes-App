from django.urls import path
from . import views
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView)
from .views import RegistrationView

router = routers.DefaultRouter()

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('notes/', views.getNotesOrCreateNote, name="get-all-or-create"),
    path('notes/<str:pk>/', views.getOrModifyNote, name="get-or-modify"),

    path('register', RegistrationView.as_view(), name="register"),

    path('', include(router.urls)),
]
