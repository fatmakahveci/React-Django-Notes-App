from django.db import models
from django.contrib.auth.models import User


class User(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.body[0:100]

    class Meta:
        ordering = ["-updated"]
