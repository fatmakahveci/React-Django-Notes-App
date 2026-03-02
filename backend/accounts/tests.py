from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_and_login(self):
        register_payload = {
            "email": "test@example.com",
            "user_name": "testuser",
            "password": "StrongPass1!",
            "match_password": "StrongPass1!",
        }

        r = self.client.post("/api/accounts/register/", register_payload, format="json")
        self.assertIn(r.status_code, (200, 201), r.data)

        token_payload = {"email": "test@example.com", "password": "StrongPass1!"}
        r = self.client.post("/api/accounts/token/", token_payload, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertIn("access", r.data)
        self.assertIn("refresh", r.data)

        refresh_payload = {"refresh": r.data["refresh"]}
        rr = self.client.post(
            "/api/accounts/token/refresh/", refresh_payload, format="json"
        )
        self.assertEqual(rr.status_code, 200, rr.data)
        self.assertIn("access", rr.data)
