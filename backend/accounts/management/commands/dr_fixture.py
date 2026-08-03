import os

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django_otp.plugins.otp_totp.models import TOTPDevice

from accounts.models import AuditEvent, CustomUser
from notes.models import Note


class Command(BaseCommand):
    help = "Seed or verify the isolated disaster-recovery test fixture."

    def add_arguments(self, parser):
        parser.add_argument("operation", choices=("seed", "verify"))
        parser.add_argument("--marker", required=True)

    def handle(self, *args, **options):
        if os.getenv("DJANGO_ALLOW_DR_TEST_FIXTURE", "").lower() != "true":
            raise CommandError(
                "Set DJANGO_ALLOW_DR_TEST_FIXTURE=true only in an isolated test database."
            )
        self.fixture_password = os.getenv("DJANGO_DR_TEST_PASSWORD", "")
        if len(self.fixture_password) < 16:
            raise CommandError("DJANGO_DR_TEST_PASSWORD must contain at least 16 characters.")

        marker = options["marker"].strip()
        if not marker or len(marker) > 24 or not marker.replace("-", "").isalnum():
            raise CommandError("The marker must be 1-24 letters, digits, or hyphens.")

        if options["operation"] == "seed":
            self.seed(marker)
        else:
            self.verify(marker)

    @transaction.atomic
    def seed(self, marker):
        email = f"dr-{marker}@example.invalid"
        if CustomUser.objects.filter(email=email).exists():
            raise CommandError("The DR fixture already exists; use a clean database.")

        user = CustomUser.objects.create_user(
            email=email,
            user_name=f"dr-{marker}",
            password=self.fixture_password,
        )
        note = Note.objects.create(
            user=user,
            title=f"DR probe {marker}",
            body="Backup and restore integrity probe.",
        )
        TOTPDevice.objects.create(user=user, name=f"dr-{marker}", confirmed=True)
        AuditEvent.objects.create(
            actor=user,
            actor_identifier=email,
            action=AuditEvent.Action.ADMIN_CREATE,
            target_type=note._meta.label,
            target_id=str(note.pk),
            target_repr=str(note),
            changes={"fixture": marker},
        )
        self.stdout.write(self.style.SUCCESS(f"DR fixture seeded: {marker}"))

    def verify(self, marker):
        email = f"dr-{marker}@example.invalid"
        try:
            user = CustomUser.objects.get(email=email, user_name=f"dr-{marker}")
            note = Note.objects.get(
                user=user,
                title=f"DR probe {marker}",
                body="Backup and restore integrity probe.",
            )
            device = TOTPDevice.objects.get(
                user=user,
                name=f"dr-{marker}",
                confirmed=True,
            )
            event = AuditEvent.objects.get(
                actor=user,
                actor_identifier=email,
                action=AuditEvent.Action.ADMIN_CREATE,
                target_type=note._meta.label,
                target_id=str(note.pk),
                changes={"fixture": marker},
            )
        except (CustomUser.DoesNotExist, Note.DoesNotExist, TOTPDevice.DoesNotExist, AuditEvent.DoesNotExist) as error:
            raise CommandError(f"Restored DR fixture is incomplete: {error}") from error

        if not user.check_password(self.fixture_password):
            raise CommandError("The restored password hash failed verification.")
        if not device.bin_key or event.target_repr != note.title:
            raise CommandError("The restored related data failed integrity verification.")

        self.stdout.write(self.style.SUCCESS(f"DR fixture verified: {marker}"))
