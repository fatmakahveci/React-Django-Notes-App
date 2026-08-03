from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import CustomUser
from config.exceptions import api_exception_handler


class APIErrorSchemaTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        cache.clear()

    def assert_error(self, response, status_code, code):
        payload = response.data if hasattr(response, "data") else response.json()
        self.assertEqual(response.status_code, status_code)
        self.assertEqual(set(payload), {"error"})
        self.assertEqual(
            set(payload["error"]),
            {"code", "message", "status", "details"},
        )
        self.assertEqual(payload["error"]["code"], code)
        self.assertEqual(payload["error"]["status"], status_code)

    def test_validation_error_includes_field_details(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "email": "invalid",
                "user_name": "u",
                "password": "short",
                "match_password": "different",
            },
            format="json",
        )

        self.assert_error(response, 400, "validation_error")
        self.assertEqual(response.data["error"]["message"], "Request validation failed.")
        self.assertIn("password", response.data["error"]["details"])

    def test_authentication_and_not_found_errors_share_the_schema(self):
        unauthorized = self.client.get("/api/notes/")
        self.assert_error(unauthorized, 401, "authentication_required")

        user = CustomUser.objects.create_user(
            "errors@example.com", "errors", "StrongPass1!"
        )
        self.client.force_authenticate(user)
        missing = self.client.get("/api/notes/999999/")
        self.assert_error(missing, 404, "not_found")

    @override_settings(DEBUG=False)
    def test_unknown_api_route_returns_json_error_schema(self):
        response = self.client.get("/api/does-not-exist/")

        self.assertEqual(response["Content-Type"], "application/json")
        self.assert_error(response, 404, "not_found")

    @patch("config.exceptions.LOGGER.exception")
    def test_unhandled_error_is_logged_without_leaking_details(self, log_exception):
        response = api_exception_handler(RuntimeError("sensitive internals"), {})

        self.assert_error(response, 500, "internal_server_error")
        self.assertNotIn("sensitive", response.data["error"]["message"])
        self.assertIsNone(response.data["error"]["details"])
        log_exception.assert_called_once()
