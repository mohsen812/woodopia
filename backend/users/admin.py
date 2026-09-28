from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = (
        'username',
        'email',
        'phone',
        'is_email_verified',
        'is_phone_verified',
        'is_staff',
    )

    fieldsets = UserAdmin.fieldsets + (
        (
            'Feemaas Information',
            {
                'fields': (
                    'phone',
                    'google_id',
                    'is_email_verified',
                    'is_phone_verified',
                )
            }
        ),
    )
