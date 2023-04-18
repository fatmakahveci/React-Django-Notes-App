from django.contrib.auth.models import AbstractUser, UserManager


class AuthorManager(UserManager):
    pass


class Author(AbstractUser):
    objects = AuthorManager()
