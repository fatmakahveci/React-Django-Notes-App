from django.core.cache import cache
from django.test import TestCase
from drf_spectacular.generators import SchemaGenerator
from jsonschema import RefResolver
from openapi_schema_validator import OAS30Validator
from openapi_spec_validator import validate
from rest_framework.test import APIClient

from accounts.models import CustomUser


class OpenAPIContractTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.schema = SchemaGenerator().get_schema(request=None, public=True)
        cls.resolver = RefResolver.from_schema(cls.schema)

    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def tearDown(self):
        cache.clear()

    def assert_matches_schema(self, path, method, response):
        operation = self.schema["paths"][path][method.lower()]
        documented_response = operation["responses"][str(response.status_code)]
        if response.status_code == 204:
            self.assertFalse(response.content)
            return

        media = documented_response["content"]["application/json"]
        OAS30Validator(media["schema"], resolver=self.resolver).validate(response.json())

    def test_schema_is_valid_and_covers_every_public_operation(self):
        validate(self.schema)
        actual_operations = {
            path: {
                method
                for method in definition
                if method in {"get", "post", "put", "patch", "delete"}
            }
            for path, definition in self.schema["paths"].items()
        }
        self.assertEqual(
            actual_operations,
            {
                "/api/accounts/csrf/": {"get"},
                "/api/accounts/logout/": {"post"},
                "/api/accounts/password-policy/": {"get"},
                "/api/accounts/register/": {"post"},
                "/api/accounts/session/": {"get"},
                "/api/accounts/token/": {"post"},
                "/api/accounts/token/refresh/": {"post"},
                "/api/notes/": {"get", "post"},
                "/api/notes/{id}/": {"get", "put", "patch", "delete"},
            },
        )

    def test_authentication_endpoint_responses_match_the_schema(self):
        policy = self.client.get("/api/accounts/password-policy/")
        self.assert_matches_schema(
            "/api/accounts/password-policy/", "get", policy
        )

        csrf = self.client.get("/api/accounts/csrf/")
        self.assert_matches_schema("/api/accounts/csrf/", "get", csrf)

        credentials = {
            "email": "contract@example.com",
            "user_name": "contract",
            "password": "StrongPass1!",
            "match_password": "StrongPass1!",
        }
        registration = self.client.post(
            "/api/accounts/register/", credentials, format="json"
        )
        self.assert_matches_schema(
            "/api/accounts/register/", "post", registration
        )

        login = self.client.post(
            "/api/accounts/token/",
            {"email": credentials["email"], "password": credentials["password"]},
            format="json",
        )
        self.assert_matches_schema("/api/accounts/token/", "post", login)

        refresh = self.client.post("/api/accounts/token/refresh/", {}, format="json")
        self.assert_matches_schema(
            "/api/accounts/token/refresh/", "post", refresh
        )

        session = self.client.get("/api/accounts/session/")
        self.assert_matches_schema("/api/accounts/session/", "get", session)

        logout = self.client.post("/api/accounts/logout/", {}, format="json")
        self.assert_matches_schema("/api/accounts/logout/", "post", logout)

    def test_note_crud_responses_match_the_schema(self):
        user = CustomUser.objects.create_user(
            "notes-contract@example.com", "notescontract", "StrongPass1!"
        )
        self.client.force_authenticate(user)

        listing = self.client.get("/api/notes/")
        self.assert_matches_schema("/api/notes/", "get", listing)

        created = self.client.post(
            "/api/notes/", {"title": "Contract", "body": "Created"}, format="json"
        )
        self.assert_matches_schema("/api/notes/", "post", created)
        detail_path = f"/api/notes/{created.data['id']}/"

        retrieved = self.client.get(detail_path)
        self.assert_matches_schema("/api/notes/{id}/", "get", retrieved)

        replaced = self.client.put(
            detail_path, {"title": "Replaced", "body": "Body"}, format="json"
        )
        self.assert_matches_schema("/api/notes/{id}/", "put", replaced)

        patched = self.client.patch(detail_path, {"body": "Patched"}, format="json")
        self.assert_matches_schema("/api/notes/{id}/", "patch", patched)

        deleted = self.client.delete(detail_path)
        self.assert_matches_schema("/api/notes/{id}/", "delete", deleted)

    def test_published_schema_endpoint_returns_the_valid_document(self):
        response = self.client.get("/api/schema/?format=json")

        self.assertEqual(response.status_code, 200)
        validate(response.json())
