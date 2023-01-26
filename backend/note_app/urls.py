from django.urls import path
from . import views

from django.urls import path, include
from rest_framework import routers

from rest_framework_simplejwt.views import TokenRefreshView # new - authentication

router = routers.DefaultRouter()                   
router.register(r'notes', views.NoteView, 'note')  

urlpatterns = [
  path('', include(router.urls)),

  path('token/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'), # new - authentication - takes user data and updates a pair of tokens to authenticate these credentials
  path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # new - authentication - takes a fresh token and updates it

  path('notes/', views.getNotes, name="notes"),
  path('notes/<str:pk>/', views.getNote, name="note"),
]
