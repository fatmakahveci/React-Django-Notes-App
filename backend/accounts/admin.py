from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .admin_audit import AuditAdminMixin
from .models import AuditEvent, CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(AuditAdminMixin, UserAdmin):
    model = CustomUser
    ordering = ("email",)
    list_display = ("email", "user_name", "is_staff", "is_active")
    search_fields = ("email", "user_name")

    fieldsets = (
        (None, {"fields": ("email", "user_name", "password")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_staff",
                    "is_active",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "user_name",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )

    filter_horizontal = ("groups", "user_permissions")


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = (
        "occurred_at",
        "action",
        "actor_identifier",
        "target_type",
        "target_id",
        "ip_address",
    )
    list_filter = ("action", "occurred_at")
    search_fields = ("actor_identifier", "target_type", "target_id", "target_repr")
    readonly_fields = (
        "occurred_at",
        "actor",
        "actor_identifier",
        "action",
        "target_type",
        "target_id",
        "target_repr",
        "changes",
        "ip_address",
        "user_agent",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
