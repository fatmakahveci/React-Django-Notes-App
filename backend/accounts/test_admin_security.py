from io import StringIO

from django.contrib.admin.sites import AdminSite
from django.core.management import call_command
from django.db import connection
from django.test import RequestFactory, TestCase
from django_otp.plugins.otp_totp.models import TOTPDevice
from django_otp.oath import TOTP

from accounts.admin import AuditEventAdmin
from accounts.admin_audit import AuditAdminMixin
from accounts.models import AuditEvent, CustomUser
from notes.admin import NoteAdmin
from notes.models import Note
from config.urls import otp_admin_site


class AdminSecurityTests(TestCase):
    def setUp(self):
        self.admin = CustomUser.objects.create_superuser(
            "admin-mfa@example.com", "adminmfa", "StrongPass1!"
        )

    def test_admin_rejects_password_only_session(self):
        self.client.force_login(self.admin)

        response = self.client.get("/admin/")

        self.assertEqual(response.status_code, 302)
        self.assertIn("/admin/login/", response.url)

    def test_admin_login_requires_valid_totp_and_audits_success(self):
        device = TOTPDevice.objects.create(
            user=self.admin, name="test", confirmed=True
        )

        response = self.client.post(
            "/admin/login/?next=/admin/",
            {
                "username": self.admin.email,
                "password": "StrongPass1!",
                "otp_device": device.persistent_id,
                "otp_token": str(
                    TOTP(
                        device.bin_key,
                        device.step,
                        device.t0,
                        device.digits,
                        device.drift,
                    ).token()
                ),
                "next": "/admin/",
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, "/admin/")
        event = AuditEvent.objects.get(action=AuditEvent.Action.ADMIN_LOGIN)
        self.assertEqual(event.actor, self.admin)
        self.assertEqual(event.actor_identifier, self.admin.email)
        self.assertTrue(
            AuditEvent.objects.filter(
                action=AuditEvent.Action.MFA_SUCCEEDED,
                actor=self.admin,
            ).exists()
        )

    def test_invalid_totp_is_audited(self):
        device = TOTPDevice.objects.create(
            user=self.admin, name="test", confirmed=True
        )

        response = self.client.post(
            "/admin/login/",
            {
                "username": self.admin.email,
                "password": "StrongPass1!",
                "otp_device": device.persistent_id,
                "otp_token": "000000",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            AuditEvent.objects.filter(
                action=AuditEvent.Action.MFA_FAILED,
                actor=self.admin,
            ).exists()
        )
        event = AuditEvent.objects.get(action=AuditEvent.Action.MFA_FAILED)
        self.assertEqual(str(event.ip_address), "127.0.0.1")

    def test_admin_object_changes_are_audited(self):
        note = Note.objects.create(user=self.admin, title="Audited")
        request = RequestFactory().post("/admin/notes/note/")
        request.user = self.admin
        model_admin = NoteAdmin(Note, AdminSite())

        model_admin.log_addition(request, note, [{"added": {}}])
        model_admin.log_change(request, note, [{"changed": {"fields": ["Title"]}}])
        model_admin.log_deletions(request, Note.objects.filter(pk=note.pk))

        self.assertEqual(
            set(AuditEvent.objects.values_list("action", flat=True)),
            {
                AuditEvent.Action.ADMIN_CREATE,
                AuditEvent.Action.ADMIN_UPDATE,
                AuditEvent.Action.ADMIN_DELETE,
            },
        )

    def test_audit_records_are_read_only_in_admin(self):
        model_admin = AuditEventAdmin(AuditEvent, AdminSite())
        request = RequestFactory().get("/admin/accounts/auditevent/")
        request.user = self.admin

        self.assertFalse(model_admin.has_add_permission(request))
        self.assertFalse(model_admin.has_change_permission(request))
        self.assertFalse(model_admin.has_delete_permission(request))

    def test_all_mutable_admin_models_use_operation_auditing(self):
        for model, model_admin in otp_admin_site._registry.items():
            if model is not AuditEvent:
                self.assertIsInstance(model_admin, AuditAdminMixin)

    def test_provision_command_creates_device_without_auditing_secret(self):
        output = StringIO()

        call_command(
            "provision_admin_mfa",
            email=self.admin.email,
            stdout=output,
        )

        device = TOTPDevice.objects.get(user=self.admin, name="primary")
        event = AuditEvent.objects.get(action=AuditEvent.Action.MFA_ENROLLED)
        self.assertTrue(device.confirmed)
        self.assertIn("otpauth://", output.getvalue())
        self.assertNotIn(device.config_url, str(event.changes))
        self.assertNotIn(device.config_url, event.target_repr)

    def test_audit_index_matches_action_and_time_order(self):
        with connection.cursor() as cursor:
            constraints = connection.introspection.get_constraints(
                cursor,
                AuditEvent._meta.db_table,
            )

        index = constraints["audit_action_time_idx"]
        self.assertTrue(index["index"])
        self.assertEqual(index["columns"], ["action", "occurred_at"])
