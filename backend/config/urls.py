from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # API endpoints
    path("api/notes/", include("notes.urls")),
    path("api/accounts/", include("accounts.urls")),
]
