from django.core.management.base import BaseCommand, CommandError
from django_otp.plugins.otp_totp.models import TOTPDevice

from accounts.audit import record_audit_event
from accounts.models import AuditEvent, CustomUser


class Command(BaseCommand):
    help = "Create a confirmed TOTP device for an existing staff account."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--name", default="primary")

    def handle(self, *args, **options):
        try:
            user = CustomUser.objects.get(email=options["email"], is_staff=True)
        except CustomUser.DoesNotExist as error:
            raise CommandError("A staff account with that email does not exist.") from error

        if TOTPDevice.objects.filter(user=user, name=options["name"]).exists():
            raise CommandError("An MFA device with that name already exists.")

        device = TOTPDevice.objects.create(
            user=user,
            name=options["name"],
            confirmed=True,
        )
        record_audit_event(
            None,
            AuditEvent.Action.MFA_ENROLLED,
            actor=user,
            target=device,
        )

        self.stdout.write(self.style.WARNING("Treat this provisioning URI as a secret."))
        self.stdout.write(device.config_url)
        self.stdout.write(self.style.SUCCESS("Admin MFA device created."))
