from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.settings_runtime import require_runtime_environment, runtime_security


class RuntimeSettingsTests(SimpleTestCase):
    valid_environment = {
        "DJANGO_SECRET_KEY": "A-strong-runtime-secret-1234567890-abcdefghijklmnopqrstuvwxyz",
        "DATABASE_URL": "postgresql://notes:password@db:5432/notes",
        "DJANGO_CACHE_URL": "redis://cache:6379/0",
        "DJANGO_ALLOWED_HOSTS": "notes.example.com",
    }

    def test_runtime_profile_rejects_missing_required_values(self):
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaisesMessage(ImproperlyConfigured, "production requires"):
                require_runtime_environment("production")

    def test_runtime_profile_requires_postgres_and_redis(self):
        invalid = {
            **self.valid_environment,
            "DATABASE_URL": "sqlite:///db.sqlite3",
            "DJANGO_CACHE_URL": "locmem://cache",
        }
        with patch.dict("os.environ", invalid, clear=True):
            with self.assertRaisesMessage(ImproperlyConfigured, "PostgreSQL"):
                require_runtime_environment("staging")

    def test_production_security_cannot_be_disabled_by_environment(self):
        with patch.dict("os.environ", self.valid_environment, clear=True):
            values = runtime_security(
                "production",
                hsts_seconds=31536000,
                include_subdomains=True,
                preload=True,
            )

        self.assertFalse(values["DEBUG"])
        self.assertTrue(values["SECURE_SSL_REDIRECT"])
        self.assertTrue(values["SESSION_COOKIE_SECURE"])
        self.assertTrue(values["CSRF_COOKIE_SECURE"])
        self.assertTrue(values["JWT_COOKIE_SECURE"])
        self.assertEqual(values["SECURE_HSTS_SECONDS"], 31536000)
