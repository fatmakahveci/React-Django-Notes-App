from django.contrib import admin
from .models import Note


class NoteAdmin(admin.ModelAdmin):
    list_display = ('body', 'updated', 'created')


admin.site.register(Note, NoteAdmin)
