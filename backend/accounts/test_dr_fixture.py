import os
from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from accounts.models import CustomUser


class DisasterRecoveryFixtureTests(TestCase):
    def run_command(self, operation, marker="unit-test"):
        output = StringIO()
        with patch.dict(
            os.environ,
            {
                "DJANGO_ALLOW_DR_TEST_FIXTURE": "true",
                "DJANGO_DR_TEST_PASSWORD": "UnitTestRecovery1!",
            },
        ):
            call_command("dr_fixture", operation, marker=marker, stdout=output)
        return output.getvalue()

    def test_seed_and_verify_representative_relations(self):
        self.assertIn("seeded", self.run_command("seed"))
        self.assertIn("verified", self.run_command("verify"))

    def test_seed_refuses_to_mask_a_non_empty_fixture(self):
        self.run_command("seed")

        with self.assertRaisesMessage(CommandError, "already exists"):
            self.run_command("seed")

    def test_verify_fails_when_restored_data_is_missing(self):
        with self.assertRaisesMessage(CommandError, "incomplete"):
            self.run_command("verify", marker="missing")

    def test_command_requires_explicit_isolated_database_opt_in(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesMessage(CommandError, "isolated test database"):
                call_command("dr_fixture", "seed", marker="blocked")

        self.assertFalse(CustomUser.objects.filter(email="dr-blocked@example.invalid").exists())
