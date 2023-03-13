from django.urls import path
from . import views
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import ( TokenObtainPairView, TokenRefreshView ) # new - authentication

router = routers.DefaultRouter()

urlpatterns = [
  path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # new - authentication - takes user data and updates a pair of tokens to authenticate these credentials
  path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # new - authentication - takes a fresh token and updates it

  path('register/', views.RegisterView.as_view(), name='register'),

  path('users/', views.UserList.as_view(), name="users"),
  path('users/<int:pk>/', views.UserDetail.as_view(), name="user"),

  path('notes/', views.getNotesOrCreateNote, name="get-all-or-create"),
  path('notes/<str:pk>/', views.getOrModifyNote, name="get-or-modify"),

  path('', include(router.urls)),
]
