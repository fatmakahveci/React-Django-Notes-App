from django.contrib import admin
from django.urls import path, include
            
# new - authentication
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # new - register the app
    path('', include('note_app.urls')),

    # new - authentication   
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # takes user data and updates a pair of tokens to authenticate these credentials
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # takes a fresh token and updates it
]
