from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_auditevent")]

    operations = [
        migrations.AlterField(
            model_name="auditevent",
            name="action",
            field=models.CharField(
                choices=[
                    ("admin_login", "Admin login"),
                    ("admin_login_failed", "Admin login failed"),
                    ("admin_logout", "Admin logout"),
                    ("mfa_failed", "MFA verification failed"),
                    ("mfa_succeeded", "MFA verification succeeded"),
                    ("admin_create", "Admin created object"),
                    ("admin_update", "Admin updated object"),
                    ("admin_delete", "Admin deleted object"),
                    ("mfa_enrolled", "MFA device enrolled"),
                ],
                max_length=32,
            ),
        ),
        migrations.AddIndex(
            model_name="auditevent",
            index=models.Index(
                fields=["action", "-occurred_at"],
                name="audit_action_time_idx",
            ),
        ),
    ]
