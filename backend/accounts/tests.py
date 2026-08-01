from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from .models import CustomUser


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
        self.assertEqual(r.status_code, 201, r.data)
        self.assertNotIn("password", r.data)

        user = CustomUser.objects.get(email="test@example.com")
        self.assertTrue(user.check_password("StrongPass1!"))

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

    def test_registration_rejects_mismatched_passwords(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "email": "mismatch@example.com",
                "user_name": "mismatch",
                "password": "StrongPass1!",
                "match_password": "DifferentPass1!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(CustomUser.objects.filter(email="mismatch@example.com").exists())

    def test_registration_rejects_weak_password(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "email": "weak@example.com",
                "user_name": "weakuser",
                "password": "password",
                "match_password": "password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_registration_rejects_duplicate_email_and_username(self):
        CustomUser.objects.create_user("taken@example.com", "takenuser", "StrongPass1!")
        payload = {
            "email": "taken@example.com",
            "user_name": "takenuser",
            "password": "StrongPass1!",
            "match_password": "StrongPass1!",
        }

        response = self.client.post("/api/accounts/register/", payload, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        self.assertIn("user_name", response.data)

    def test_token_contains_frontend_user_claims(self):
        CustomUser.objects.create_user("claims@example.com", "claimsuser", "StrongPass1!")

        response = self.client.post(
            "/api/accounts/token/",
            {"email": "claims@example.com", "password": "StrongPass1!"},
            format="json",
        )
        token = AccessToken(response.data["access"])

        self.assertEqual(response.status_code, 200)
        self.assertEqual(token["email"], "claims@example.com")
        self.assertEqual(token["user_name"], "claimsuser")

    def test_invalid_credentials_do_not_return_tokens(self):
        CustomUser.objects.create_user("login@example.com", "loginuser", "StrongPass1!")

        response = self.client.post(
            "/api/accounts/token/",
            {"email": "login@example.com", "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertNotIn("access", response.data)


class CustomUserManagerTests(TestCase):
    def test_create_user_normalizes_email_and_hashes_password(self):
        user = CustomUser.objects.create_user(
            "Person@EXAMPLE.COM", "person", "StrongPass1!"
        )

        self.assertEqual(user.email, "Person@example.com")
        self.assertTrue(user.check_password("StrongPass1!"))

    def test_create_user_requires_email_and_username(self):
        with self.assertRaisesMessage(ValueError, "e-mail"):
            CustomUser.objects.create_user("", "person", "StrongPass1!")
        with self.assertRaisesMessage(ValueError, "username"):
            CustomUser.objects.create_user("person@example.com", "", "StrongPass1!")

    def test_create_superuser_sets_required_flags(self):
        user = CustomUser.objects.create_superuser(
            "admin@example.com", "adminuser", "StrongPass1!"
        )

        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
