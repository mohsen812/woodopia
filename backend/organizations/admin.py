from django.contrib import admin

from .models import (
    Organization,
    OrganizationRole,
    Membership,
    OrganizationApplication,
    OrganizationReviewLog,
)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'organization_type',
        'status',
        'owner',
        'created_at',
    )

    list_filter = (
        'organization_type',
        'status',
    )

    search_fields = (
        'name',
        'owner__email',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
    )


@admin.register(OrganizationRole)
class OrganizationRoleAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'organization_type',
        'created_at',
    )

    list_filter = (
        'organization_type',
    )

    search_fields = (
        'name',
        'description',
    )


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'organization',
        'role',
        'status',
        'joined_at',
        'ended_at',
    )

    list_filter = (
        'status',
        'role',
        'organization',
    )

    search_fields = (
        'user__email',
        'organization__name',
    )

    readonly_fields = (
        'joined_at',
    )


@admin.register(OrganizationApplication)
class OrganizationApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'organization_name',
        'applicant',
        'requested_type',
        'status',
        'reviewed_by',
        'created_at',
    )

    list_filter = (
        'requested_type',
        'status',
    )

    search_fields = (
        'organization_name',
        'applicant__email',
    )

    readonly_fields = (
        'created_at',
        'updated_at',
        'reviewed_at',
    )


@admin.register(OrganizationReviewLog)
class OrganizationReviewLogAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'application',
        'reviewer',
        'action',
        'created_at',
    )

    list_filter = (
        'action',
    )

    search_fields = (
        'application__organization_name',
        'reviewer__email',
        'comment',
    )

    readonly_fields = (
        'created_at',
    )
