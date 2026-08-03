from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="AuditEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("actor_identifier", models.CharField(blank=True, max_length=254)),
                ("action", models.CharField(choices=[("admin_login", "Admin login"), ("admin_login_failed", "Admin login failed"), ("admin_logout", "Admin logout"), ("mfa_failed", "MFA verification failed"), ("mfa_succeeded", "MFA verification succeeded"), ("admin_create", "Admin created object"), ("admin_update", "Admin updated object"), ("admin_delete", "Admin deleted object"), ("mfa_enrolled", "MFA device enrolled")], db_index=True, max_length=32)),
                ("target_type", models.CharField(blank=True, max_length=100)),
                ("target_id", models.CharField(blank=True, max_length=100)),
                ("target_repr", models.CharField(blank=True, max_length=200)),
                ("changes", models.JSONField(blank=True, default=dict)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=300)),
                ("occurred_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_events", to="accounts.customuser")),
            ],
            options={"ordering": ["-occurred_at"]},
        )
    ]
