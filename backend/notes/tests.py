from django.test import TestCase
from rest_framework.test import APIClient


class NotesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.client.post(
            "/api/accounts/register/",
            {
                "email": "notes@example.com",
                "user_name": "notesuser",
                "password": "StrongPass1!",
                "match_password": "StrongPass1!",
            },
            format="json",
        )

        token_res = self.client.post(
            "/api/accounts/token/",
            {"email": "notes@example.com", "password": "StrongPass1!"},
            format="json",
        )
        self.assertEqual(token_res.status_code, 200, token_res.data)
        self.access = token_res.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")

    def test_notes_crud(self):
        # Create
        r = self.client.post("/api/notes/", {"body": "hello"}, format="json")
        self.assertIn(r.status_code, (200, 201), r.data)
        self.assertIn("id", r.data)
        note_id = r.data["id"]

        # List
        r = self.client.get("/api/notes/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(isinstance(r.data, list))
        self.assertGreaterEqual(len(r.data), 1)

        # Detail
        r = self.client.get(f"/api/notes/{note_id}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["id"], note_id)

        # Update (your backend uses POST for updates)
        r = self.client.post(
            f"/api/notes/{note_id}/", {"body": "updated"}, format="json"
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual((r.data.get("body") or "").strip(), "updated")

        # Delete
        r = self.client.delete(f"/api/notes/{note_id}/")
        self.assertIn(r.status_code, (200, 204))

        # Ensure deleted
        r = self.client.get(f"/api/notes/{note_id}/")
        self.assertIn(r.status_code, (404, 500))
