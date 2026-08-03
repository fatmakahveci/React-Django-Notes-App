from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from .managers import CustomUserManager


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.CharField(max_length=50, unique=True)
    user_name = models.CharField(max_length=50, unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['user_name']

    objects = CustomUserManager()

    def __str__(self) -> str:
        return self.email


class AuditEvent(models.Model):
    class Action(models.TextChoices):
        ADMIN_LOGIN = "admin_login", "Admin login"
        ADMIN_LOGIN_FAILED = "admin_login_failed", "Admin login failed"
        ADMIN_LOGOUT = "admin_logout", "Admin logout"
        MFA_FAILED = "mfa_failed", "MFA verification failed"
        MFA_SUCCEEDED = "mfa_succeeded", "MFA verification succeeded"
        ADMIN_CREATE = "admin_create", "Admin created object"
        ADMIN_UPDATE = "admin_update", "Admin updated object"
        ADMIN_DELETE = "admin_delete", "Admin deleted object"
        MFA_ENROLLED = "mfa_enrolled", "MFA device enrolled"

    actor = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_events",
    )
    actor_identifier = models.CharField(max_length=254, blank=True)
    action = models.CharField(max_length=32, choices=Action.choices)
    target_type = models.CharField(max_length=100, blank=True)
    target_id = models.CharField(max_length=100, blank=True)
    target_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    occurred_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-occurred_at"]
        indexes = [
            models.Index(
                fields=["action", "-occurred_at"],
                name="audit_action_time_idx",
            ),
        ]

    def __str__(self):
        return f"{self.occurred_at.isoformat()} {self.action} {self.actor_identifier}"
