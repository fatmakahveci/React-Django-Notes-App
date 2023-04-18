
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView)
from .views import AuthorsListView, AuthorRetrieveDeleteView, RegistrationView


urlpatterns = [

    path('<slug:username>/', AuthorRetrieveDeleteView.as_view(),
         name='detail_destroy_user'),
    path('', AuthorsListView.as_view(), name='list_users')
]
