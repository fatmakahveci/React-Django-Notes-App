from django.conf import settings

from .models import AuditEvent


def client_ip(request):
    remote = request.META.get("REMOTE_ADDR") or None
    proxy_count = settings.REST_FRAMEWORK.get("NUM_PROXIES", 0)
    forwarded = [part.strip() for part in request.META.get("HTTP_X_FORWARDED_FOR", "").split(",") if part.strip()]
    if proxy_count and len(forwarded) >= proxy_count:
        return forwarded[-proxy_count]
    return remote


def record_audit_event(request, action, actor=None, target=None, changes=None, actor_identifier=""):
    actor = actor if getattr(actor, "is_authenticated", False) else None
    identifier = actor_identifier or (getattr(actor, "email", "") if actor else "")
    return AuditEvent.objects.create(
        actor=actor,
        actor_identifier=identifier[:254],
        action=action,
        target_type=target._meta.label if target is not None else "",
        target_id=str(target.pk)[:100] if target is not None and target.pk is not None else "",
        target_repr=str(target)[:200] if target is not None else "",
        changes=changes or {},
        ip_address=client_ip(request) if request is not None else None,
        user_agent=(request.META.get("HTTP_USER_AGENT", "")[:300] if request is not None else ""),
    )
