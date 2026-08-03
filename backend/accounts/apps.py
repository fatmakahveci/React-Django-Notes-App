from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'

    def ready(self):
        # Import schema extensions only after Django's app registry is ready.
        from . import schema  # noqa: F401
        from . import audit_signals  # noqa: F401
