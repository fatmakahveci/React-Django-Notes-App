from django import forms
from django_otp.admin import OTPAdminAuthenticationForm

from .audit import record_audit_event
from .models import AuditEvent


class AuditedOTPAdminAuthenticationForm(OTPAdminAuthenticationForm):
    def clean(self):
        try:
            return super().clean()
        except forms.ValidationError:
            user = self.get_user()
            if user is not None and user.is_staff:
                record_audit_event(
                    self.request,
                    AuditEvent.Action.MFA_FAILED,
                    actor=user,
                )
            raise


class AuditAdminMixin:
    def log_addition(self, request, obj, message):
        result = super().log_addition(request, obj, message)
        record_audit_event(request, AuditEvent.Action.ADMIN_CREATE, request.user, obj)
        return result

    def log_change(self, request, obj, message):
        result = super().log_change(request, obj, message)
        record_audit_event(
            request,
            AuditEvent.Action.ADMIN_UPDATE,
            request.user,
            obj,
            changes={"message": str(message)[:1000]},
        )
        return result

    def log_deletions(self, request, queryset):
        objects = list(queryset)
        result = super().log_deletions(request, queryset)
        for obj in objects:
            record_audit_event(request, AuditEvent.Action.ADMIN_DELETE, request.user, obj)
        return result


def build_audited_otp_admin_site():
    """Re-register every admin model with MFA and operation auditing enabled."""
    from django.contrib import admin
    from django_otp.admin import OTPAdminSite

    from .models import AuditEvent

    site = OTPAdminSite(name="admin")
    site.login_form = AuditedOTPAdminAuthenticationForm
    for model, model_admin in admin.site._registry.items():
        admin_class = model_admin.__class__
        if model is not AuditEvent and not issubclass(admin_class, AuditAdminMixin):
            admin_class = type(
                f"Audited{admin_class.__name__}",
                (AuditAdminMixin, admin_class),
                {},
            )
        site.register(model, admin_class)
    return site
