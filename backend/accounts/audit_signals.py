from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver

from .audit import record_audit_event
from .models import AuditEvent


def is_admin_request(request):
    return request is not None and request.path.startswith("/admin/")


@receiver(user_logged_in)
def audit_admin_login(sender, request, user, **kwargs):
    if is_admin_request(request) and user.is_staff and getattr(user, "otp_device", None):
        record_audit_event(request, AuditEvent.Action.ADMIN_LOGIN, actor=user)
        record_audit_event(request, AuditEvent.Action.MFA_SUCCEEDED, actor=user)


@receiver(user_login_failed)
def audit_admin_login_failure(sender, credentials, request, **kwargs):
    if is_admin_request(request):
        identifier = credentials.get("username") or credentials.get("email") or ""
        record_audit_event(
            request,
            AuditEvent.Action.ADMIN_LOGIN_FAILED,
            actor_identifier=str(identifier),
        )


@receiver(user_logged_out)
def audit_admin_logout(sender, request, user, **kwargs):
    if is_admin_request(request) and user is not None and user.is_staff:
        record_audit_event(request, AuditEvent.Action.ADMIN_LOGOUT, actor=user)
