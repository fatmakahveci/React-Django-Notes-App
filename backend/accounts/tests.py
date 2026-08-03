from django.test import TestCase, override_settings
from django.conf import settings
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from .models import CustomUser


class AccountsAPITests(TestCase):
    def setUp(self):
        cache.clear()
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
        self.assertNotIn("access", r.data)
        self.assertIn(settings.JWT_ACCESS_COOKIE, r.cookies)
        self.assertIn(settings.JWT_REFRESH_COOKIE, r.cookies)
        self.assertTrue(r.cookies[settings.JWT_ACCESS_COOKIE]["httponly"])

        rr = self.client.post("/api/accounts/token/refresh/", {}, format="json")
        self.assertEqual(rr.status_code, 200, rr.data)
        self.assertIn(settings.JWT_ACCESS_COOKIE, rr.cookies)

    def test_password_policy_endpoint_matches_registration_contract(self):
        response = self.client.get("/api/accounts/password-policy/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["min_length"], 8)
        self.assertEqual(response.data["max_length"], 128)
        self.assertTrue(response.data["require_uppercase"])
        self.assertTrue(response.data["require_lowercase"])
        self.assertTrue(response.data["require_digit"])
        self.assertTrue(response.data["require_special"])
        self.assertTrue(response.data["reject_common_passwords"])
        self.assertTrue(response.data["reject_user_similarity"])
        self.assertEqual(response["Cache-Control"], "public, max-age=3600")

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
        self.assertIn("password", response.data["error"]["details"])

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
        self.assertIn("email", response.data["error"]["details"])
        self.assertIn("user_name", response.data["error"]["details"])

    def test_token_does_not_duplicate_user_profile_claims(self):
        CustomUser.objects.create_user("claims@example.com", "claimsuser", "StrongPass1!")

        response = self.client.post(
            "/api/accounts/token/",
            {"email": "claims@example.com", "password": "StrongPass1!"},
            format="json",
        )
        token = AccessToken(response.cookies[settings.JWT_ACCESS_COOKIE].value)

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("email", token)
        self.assertNotIn("user_name", token)

    def test_invalid_credentials_do_not_return_tokens(self):
        CustomUser.objects.create_user("login@example.com", "loginuser", "StrongPass1!")

        response = self.client.post(
            "/api/accounts/token/",
            {"email": "login@example.com", "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)
        self.assertNotIn("access", response.data)
        self.assertEqual(response.data["error"]["code"], "authentication_required")
        self.assertEqual(response.cookies[settings.JWT_ACCESS_COOKIE].value, "")
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_registration_enforces_email_username_and_password_format(self):
        response = self.client.post(
            "/api/accounts/register/",
            {
                "email": "not-an-email",
                "user_name": "bad name",
                "password": "LongPasswordA1",
                "match_password": "LongPasswordA1",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        details = response.data["error"]["details"]
        self.assertIn("email", details)
        self.assertIn("user_name", details)

        password_response = self.client.post(
            "/api/accounts/register/",
            {
                "email": "valid-format@example.com",
                "user_name": "validformat",
                "password": "LongPasswordA1",
                "match_password": "LongPasswordA1",
            },
            format="json",
        )
        self.assertIn("password", password_response.data["error"]["details"])

    @override_settings(JWT_COOKIE_SECURE=True, JWT_COOKIE_SAMESITE="Strict")
    def test_login_sets_scoped_secure_cookies_and_disables_caching(self):
        CustomUser.objects.create_user("secure@example.com", "secureuser", "StrongPass1!")

        response = self.client.post(
            "/api/accounts/token/",
            {"email": "secure@example.com", "password": "StrongPass1!"},
            format="json",
        )

        access = response.cookies[settings.JWT_ACCESS_COOKIE]
        refresh = response.cookies[settings.JWT_REFRESH_COOKIE]
        self.assertTrue(access["httponly"])
        self.assertTrue(access["secure"])
        self.assertEqual(access["samesite"], "Strict")
        self.assertEqual(access["path"], "/api/")
        self.assertEqual(refresh["path"], "/api/accounts/")
        self.assertEqual(response["Cache-Control"], "no-store")
        self.assertEqual(response["Pragma"], "no-cache")

    def test_refresh_rotation_rejects_reuse_and_clears_invalid_cookies(self):
        CustomUser.objects.create_user("rotate@example.com", "rotateuser", "StrongPass1!")
        self.client.post(
            "/api/accounts/token/",
            {"email": "rotate@example.com", "password": "StrongPass1!"},
            format="json",
        )
        old_refresh = self.client.cookies[settings.JWT_REFRESH_COOKIE].value

        rotated = self.client.post("/api/accounts/token/refresh/", {}, format="json")
        self.assertEqual(rotated.status_code, 200)
        self.assertNotEqual(
            rotated.cookies[settings.JWT_REFRESH_COOKIE].value, old_refresh
        )

        replay_client = APIClient()
        replay_client.cookies[settings.JWT_REFRESH_COOKIE] = old_refresh
        replay = replay_client.post("/api/accounts/token/refresh/", {}, format="json")

        self.assertEqual(replay.status_code, 401)
        self.assertEqual(replay.data["error"]["code"], "authentication_required")
        self.assertEqual(replay.cookies[settings.JWT_REFRESH_COOKIE].value, "")

    def test_password_change_revokes_existing_access_and_refresh_tokens(self):
        user = CustomUser.objects.create_user(
            "revoke@example.com", "revokeuser", "StrongPass1!"
        )
        self.client.post(
            "/api/accounts/token/",
            {"email": "revoke@example.com", "password": "StrongPass1!"},
            format="json",
        )
        user.set_password("DifferentPass2!")
        user.save(update_fields=["password"])

        session = self.client.get("/api/accounts/session/")
        refresh = self.client.post("/api/accounts/token/refresh/", {}, format="json")

        self.assertEqual(session.status_code, 401)
        self.assertEqual(refresh.status_code, 401)
        self.assertEqual(refresh.cookies[settings.JWT_REFRESH_COOKIE].value, "")

    def test_session_and_logout_use_cookie_authentication(self):
        CustomUser.objects.create_user("cookie@example.com", "cookieuser", "StrongPass1!")
        self.client.post(
            "/api/accounts/token/",
            {"email": "cookie@example.com", "password": "StrongPass1!"},
            format="json",
        )

        session = self.client.get("/api/accounts/session/")
        logout = self.client.post("/api/accounts/logout/", {}, format="json")

        self.assertEqual(session.status_code, 200)
        self.assertEqual(session.data["user"]["user_name"], "cookieuser")
        self.assertEqual(logout.status_code, 204)
        self.assertEqual(logout.cookies[settings.JWT_ACCESS_COOKIE].value, "")

    def test_cookie_login_requires_csrf_token(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        CustomUser.objects.create_user("csrf@example.com", "csrfuser", "StrongPass1!")
        payload = {"email": "csrf@example.com", "password": "StrongPass1!"}

        denied = csrf_client.post("/api/accounts/token/", payload, format="json")
        csrf_client.get("/api/accounts/csrf/")
        allowed = csrf_client.post(
            "/api/accounts/token/",
            payload,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_client.cookies["csrftoken"].value,
        )

        self.assertEqual(denied.status_code, 403)
        self.assertEqual(allowed.status_code, 200)

    def test_registration_and_refresh_require_csrf_tokens(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        payload = {
            "email": "csrf-flow@example.com",
            "user_name": "csrfflow",
            "password": "StrongPass1!",
            "match_password": "StrongPass1!",
        }
        denied_registration = csrf_client.post(
            "/api/accounts/register/", payload, format="json"
        )

        csrf_client.get("/api/accounts/csrf/")
        csrf_token = csrf_client.cookies["csrftoken"].value
        registration = csrf_client.post(
            "/api/accounts/register/",
            payload,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        login = csrf_client.post(
            "/api/accounts/token/",
            {"email": payload["email"], "password": payload["password"]},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        denied_refresh = csrf_client.post(
            "/api/accounts/token/refresh/", {}, format="json"
        )

        self.assertEqual(denied_registration.status_code, 403)
        self.assertEqual(registration.status_code, 201)
        self.assertEqual(login.status_code, 200)
        self.assertEqual(denied_refresh.status_code, 403)


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
