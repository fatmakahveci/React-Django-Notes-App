from django.db import migrations, models

import notes.models


class Migration(migrations.Migration):
    dependencies = [("notes", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="note",
            name="title",
            field=models.CharField(
                blank=True,
                default=notes.models.getTitleDefault,
                max_length=120,
            ),
        ),
    ]
