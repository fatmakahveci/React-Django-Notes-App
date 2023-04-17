from django.contrib import admin
from .models import Note, User


class NoteAdmin(admin.ModelAdmin):
    list_display = ('body', 'updated', 'created')


admin.site.register(Note, NoteAdmin)
