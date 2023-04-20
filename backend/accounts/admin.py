from django.contrib import admin
from .models import CustomUser

class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'date_joined')

admin.site.register(CustomUser, CustomUserAdmin)
