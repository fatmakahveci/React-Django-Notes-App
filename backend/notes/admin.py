from django.contrib import admin
from accounts.admin_audit import AuditAdminMixin
from .models import Note


class NoteAdmin(AuditAdminMixin, admin.ModelAdmin):
    list_display = ('body', 'updated', 'created')
    readonly_fields = ('updated', 'created',)


admin.site.register(Note, NoteAdmin)
