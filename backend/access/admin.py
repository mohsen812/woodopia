from django.contrib import admin

from .models import AccessRequest


@admin.register(AccessRequest)
class AccessRequestAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "requested_type",
        "status",
        "created_at",
        "reviewed_by",
    )

    list_filter = (
        "requested_type",
        "status",
    )

    search_fields = (
        "user__username",
        "user__email",
    )