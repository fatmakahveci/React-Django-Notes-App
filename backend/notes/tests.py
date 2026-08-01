from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import CustomUser
from .models import Note


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
        self.user = CustomUser.objects.get(email="notes@example.com")

    def test_notes_crud(self):
        # Create
        r = self.client.post("/api/notes/", {"body": "hello"}, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertIn("id", r.data)
        note_id = r.data["id"]

        # List
        r = self.client.get("/api/notes/")
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(r.data["count"], 1)
        self.assertGreaterEqual(len(r.data["results"]), 1)

        # Detail
        r = self.client.get(f"/api/notes/{note_id}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["id"], note_id)

        # Partial update
        r = self.client.patch(
            f"/api/notes/{note_id}/", {"body": "updated"}, format="json"
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual((r.data.get("body") or "").strip(), "updated")

        # Delete
        r = self.client.delete(f"/api/notes/{note_id}/")
        self.assertEqual(r.status_code, 204)

        # Ensure deleted
        r = self.client.get(f"/api/notes/{note_id}/")
        self.assertEqual(r.status_code, 404)

    def test_notes_are_isolated_between_users(self):
        note = Note.objects.create(
            user=self.user,
            body="private",
        )

        other_client = APIClient()
        other_client.post(
            "/api/accounts/register/",
            {
                "email": "other@example.com",
                "user_name": "otheruser",
                "password": "StrongPass1!",
                "match_password": "StrongPass1!",
            },
            format="json",
        )
        token_response = other_client.post(
            "/api/accounts/token/",
            {"email": "other@example.com", "password": "StrongPass1!"},
            format="json",
        )

        self.assertEqual(other_client.get(f"/api/notes/{note.id}/").status_code, 404)
        self.assertEqual(other_client.patch(
            f"/api/notes/{note.id}/", {"body": "stolen"}, format="json"
        ).status_code, 404)
        self.assertEqual(other_client.delete(f"/api/notes/{note.id}/").status_code, 404)

        note.refresh_from_db()
        self.assertEqual(note.body, "private")

    def test_authentication_is_required(self):
        anonymous_client = APIClient()
        self.assertEqual(anonymous_client.get("/api/notes/").status_code, 401)

    def test_create_assigns_owner_and_read_only_fields(self):
        response = self.client.post(
            "/api/notes/",
            {"title": "Owned", "body": "content", "user": "otheruser", "id": 999},
            format="json",
        )

        note = Note.objects.get(id=response.data["id"])
        self.assertEqual(response.status_code, 201)
        self.assertEqual(note.user, self.user)
        self.assertNotEqual(note.id, 999)
        self.assertEqual(response.data["user"], "notesuser")

    def test_list_only_contains_current_user_notes_in_update_order(self):
        older = Note.objects.create(user=self.user, title="Older")
        newer = Note.objects.create(user=self.user, title="Newer")
        other = CustomUser.objects.create_user(
            "hidden@example.com", "hiddenuser", "StrongPass1!"
        )
        Note.objects.create(user=other, title="Hidden")

        response = self.client.get("/api/notes/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.data["results"]],
            [newer.id, older.id],
        )

    def test_put_replaces_editable_fields(self):
        note = Note.objects.create(user=self.user, title="Before", body="old")

        response = self.client.put(
            f"/api/notes/{note.id}/",
            {"title": "After", "body": "new"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "After")
        self.assertEqual(response.data["body"], "new")

    def test_default_title_uses_calendar_day(self):
        note = Note.objects.create(user=self.user)

        self.assertRegex(note.title, r"^Note of \d{2} [A-Z][a-z]{2}, \d{4}$")

    def test_search_matches_title_and_body(self):
        Note.objects.create(user=self.user, title="Project Aurora", body="planning")
        Note.objects.create(user=self.user, title="Shopping", body="coffee beans")
        Note.objects.create(user=self.user, title="Unrelated", body="nothing here")

        title_response = self.client.get("/api/notes/?search=aurora")
        body_response = self.client.get("/api/notes/?search=coffee")

        self.assertEqual(title_response.data["count"], 1)
        self.assertEqual(title_response.data["results"][0]["title"], "Project Aurora")
        self.assertEqual(body_response.data["count"], 1)
        self.assertEqual(body_response.data["results"][0]["title"], "Shopping")

    def test_pagination_limits_page_size(self):
        Note.objects.bulk_create(
            [Note(user=self.user, title=f"Note {index}") for index in range(13)]
        )

        first_page = self.client.get("/api/notes/")
        second_page = self.client.get("/api/notes/?page=2")

        self.assertEqual(first_page.data["count"], 13)
        self.assertEqual(len(first_page.data["results"]), 12)
        self.assertEqual(len(second_page.data["results"]), 1)
