from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from accounts.models import CustomUser


TEST_RATES = {
    "anonymous": "10/minute",
    "user": "1/minute",
    "admin": "2/minute",
    "security_scanner": "2/minute",
    "authentication": "1/minute",
}


@override_settings(SECURITY_SCANNER_KEY="scanner-test-key")
class RateLimitTests(TestCase):
    def setUp(self):
        cache.clear()
        self.rates_patch = patch.object(
            SimpleRateThrottle, "THROTTLE_RATES", TEST_RATES
        )
        self.rates_patch.start()
        self.user = CustomUser.objects.create_user(
            "user@example.com", "user", "StrongPass1!"
        )
        self.admin = CustomUser.objects.create_superuser(
            "admin@example.com", "admin", "StrongPass1!"
        )

    def tearDown(self):
        self.rates_patch.stop()
        cache.clear()

    def test_user_and_admin_have_independent_quotas(self):
        user_client = APIClient()
        user_client.force_authenticate(self.user)
        admin_client = APIClient()
        admin_client.force_authenticate(self.admin)

        self.assertEqual(user_client.get("/api/notes/").status_code, 200)
        self.assertEqual(user_client.get("/api/notes/").status_code, 429)
        self.assertEqual(admin_client.get("/api/notes/").status_code, 200)
        self.assertEqual(admin_client.get("/api/notes/").status_code, 200)
        self.assertEqual(admin_client.get("/api/notes/").status_code, 429)

    def test_scanner_requires_the_configured_key_and_uses_its_own_quota(self):
        scanner_client = APIClient()
        scanner_headers = {"HTTP_X_SECURITY_SCANNER_KEY": "scanner-test-key"}

        self.assertEqual(
            scanner_client.get("/api/accounts/csrf/", **scanner_headers).status_code,
            200,
        )
        self.assertEqual(
            scanner_client.get("/api/accounts/csrf/", **scanner_headers).status_code,
            200,
        )
        self.assertEqual(
            scanner_client.get("/api/accounts/csrf/", **scanner_headers).status_code,
            429,
        )

        anonymous_client = APIClient()
        self.assertEqual(anonymous_client.get("/api/accounts/csrf/").status_code, 200)

    def test_authentication_has_a_stricter_brute_force_quota(self):
        payload = {"email": "missing@example.com", "password": "WrongPass1!"}

        self.assertEqual(
            self.client.post("/api/accounts/token/", payload, format="json").status_code,
            401,
        )
        response = self.client.post("/api/accounts/token/", payload, format="json")

        self.assertEqual(response.status_code, 429)
        self.assertIn("Retry-After", response)
        self.assertEqual(response.data["error"]["code"], "rate_limit_exceeded")

    def test_scanner_key_changes_throttling_only_not_permissions(self):
        response = self.client.get(
            "/api/notes/", HTTP_X_SECURITY_SCANNER_KEY="scanner-test-key"
        )

        self.assertEqual(response.status_code, 401)
