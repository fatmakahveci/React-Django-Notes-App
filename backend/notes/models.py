from django.db import models
from users.models import Author
import datetime


def getTitleDefault():
    return f'Note of {datetime.date.today().strftime("%w %b, %Y")}'


class Note(models.Model):
    author = models.ForeignKey(
        to=Author, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=20, blank=True,
                             default=getTitleDefault)
    body = models.TextField(null=True, blank=True)
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-updated"]
