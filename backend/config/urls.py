from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView
from accounts.admin_audit import build_audited_otp_admin_site

otp_admin_site = build_audited_otp_admin_site()

urlpatterns = [
    path("admin/", otp_admin_site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="openapi-schema"),
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("notes.urls")),
]

handler400 = "config.error_views.bad_request_handler"
handler403 = "config.error_views.permission_denied_handler"
handler404 = "config.error_views.page_not_found_handler"
handler500 = "config.error_views.server_error_handler"
