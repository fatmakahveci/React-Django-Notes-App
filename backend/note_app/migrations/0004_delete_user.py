# Generated by Django 4.1.5 on 2023-04-17 12:02

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('note_app', '0003_rename_register_user'),
    ]

    operations = [
        migrations.DeleteModel(
            name='User',
        ),
    ]