from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("notes", "0002_alter_note_title")]

    operations = [
        migrations.AlterField(
            model_name="note",
            name="user",
            field=models.ForeignKey(
                db_index=False,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="notes",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddIndex(
            model_name="note",
            index=models.Index(
                fields=["user", "-updated"],
                name="note_user_updated_idx",
            ),
        ),
    ]
