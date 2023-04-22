from django.contrib import admin
from .models import CustomUser


class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'user_name', 'date_joined')


admin.site.register(CustomUser, CustomUserAdmin)
