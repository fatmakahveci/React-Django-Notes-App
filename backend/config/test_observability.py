import json
import logging
from io import StringIO
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from config.observability import JSONFormatter, initialize_sentry, scrub_sentry_event


class ObservabilityTests(TestCase):
    def test_request_id_is_preserved_or_safely_generated(self):
        client = APIClient()

        preserved = client.get(
            "/api/accounts/csrf/",
            HTTP_X_REQUEST_ID="edge-request_123",
        )
        generated = client.get(
            "/api/accounts/csrf/",
            HTTP_X_REQUEST_ID="invalid request id\n",
        )

        self.assertEqual(preserved["X-Request-ID"], "edge-request_123")
        self.assertRegex(generated["X-Request-ID"], r"^[a-f0-9]{32}$")

    def test_json_request_log_contains_request_user_and_release_context(self):
        client = APIClient()
        client.post(
            "/api/accounts/register/",
            {
                "email": "logs@example.com",
                "user_name": "logsuser",
                "password": "StrongPass1!",
                "match_password": "StrongPass1!",
            },
            format="json",
        )
        client.post(
            "/api/accounts/token/",
            {"email": "logs@example.com", "password": "StrongPass1!"},
            format="json",
        )

        stream = StringIO()
        handler = logging.StreamHandler(stream)
        handler.setFormatter(JSONFormatter())
        logger = logging.getLogger("app.request")
        previous_handlers = logger.handlers
        previous_level = logger.level
        logger.handlers = [handler]
        logger.setLevel(logging.INFO)
        try:
            response = client.get(
                "/api/notes/",
                HTTP_X_REQUEST_ID="observability-test",
            )
        finally:
            logger.handlers = previous_handlers
            logger.setLevel(previous_level)

        payload = json.loads(stream.getvalue())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["request_id"], "observability-test")
        self.assertTrue(payload["user_id"])
        self.assertEqual(payload["environment"], "test")
        self.assertTrue(payload["release"])
        self.assertEqual(payload["http_method"], "GET")
        self.assertEqual(payload["http_path"], "/api/notes/")
        self.assertEqual(payload["http_status"], 200)

    def test_sentry_event_scrubs_sensitive_request_values(self):
        event = {
            "request": {
                "headers": {
                    "Authorization": "Bearer secret",
                    "Cookie": "session=secret",
                    "X-Security-Scanner-Key": "scanner-secret",
                    "User-Agent": "test-agent",
                },
                "cookies": {"notes_access": "secret"},
            }
        }

        scrubbed = scrub_sentry_event(event, {})

        self.assertEqual(
            scrubbed["request"]["headers"],
            {"User-Agent": "test-agent"},
        )
        self.assertNotIn("cookies", scrubbed["request"])

    def test_framework_log_falls_back_to_the_django_request_context(self):
        record = logging.LogRecord(
            "django.request",
            logging.WARNING,
            __file__,
            1,
            "Not Found",
            (),
            None,
        )
        record.request = SimpleNamespace(
            request_id="framework-request",
            user=SimpleNamespace(is_authenticated=True, pk=42),
        )

        payload = json.loads(JSONFormatter().format(record))

        self.assertEqual(payload["request_id"], "framework-request")
        self.assertEqual(payload["user_id"], "42")

    @patch("config.observability.sentry_sdk.init")
    def test_sentry_initialization_uses_safe_release_context(self, init):
        with patch.dict(
            "os.environ",
            {
                "SENTRY_DSN": "https://public@example.invalid/1",
                "APP_RELEASE": "commit-abc123",
                "SENTRY_TRACES_SAMPLE_RATE": "0.25",
            },
            clear=True,
        ):
            enabled = initialize_sentry("staging")

        self.assertTrue(enabled)
        kwargs = init.call_args.kwargs
        self.assertEqual(kwargs["environment"], "staging")
        self.assertEqual(kwargs["release"], "commit-abc123")
        self.assertEqual(kwargs["traces_sample_rate"], 0.25)
        self.assertFalse(kwargs["send_default_pii"])
