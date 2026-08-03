from django.conf import settings
from django.core.cache import cache
from django.test import SimpleTestCase


class CacheConfigurationTests(SimpleTestCase):
    def tearDown(self):
        cache.clear()

    def test_cache_keys_are_namespaced_and_versioned(self):
        key = cache.make_key("throttle_test")

        self.assertIn(settings.CACHE_KEY_PREFIX, key)
        self.assertIn(f":{settings.CACHE_VERSION}:", key)

    def test_version_change_invalidates_without_clearing_other_keys(self):
        current_version = settings.CACHE_VERSION
        next_version = current_version + 1
        cache.set("release-key", "old", version=current_version)

        self.assertEqual(cache.get("release-key", version=current_version), "old")
        self.assertIsNone(cache.get("release-key", version=next_version))

    def test_configured_backend_and_timeout_are_explicit(self):
        expected_backend = (
            "django.core.cache.backends.redis.RedisCache"
            if settings.CACHE_URL
            else "django.core.cache.backends.locmem.LocMemCache"
        )
        self.assertEqual(
            settings.CACHES["default"]["BACKEND"],
            expected_backend,
        )
        self.assertEqual(
            settings.CACHES["default"]["TIMEOUT"],
            settings.CACHE_DEFAULT_TIMEOUT,
        )
