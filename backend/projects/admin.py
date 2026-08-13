from django.contrib import admin

from .models import (
    Project,
    ProjectItem,
    SubProject,
    SubProjectType,
    SubProjectDependency,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'customer',
        'status',
        'created_at',
    )


@admin.register(ProjectItem)
class ProjectItemAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'project',
        'quantity',
        'status',
    )


@admin.register(SubProjectType)
class SubProjectTypeAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'code',
    )

    search_fields = (
        'name',
        'code',
    )


@admin.register(SubProject)
class SubProjectAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'project_item',
        'subproject_type',
        'status',
        'assigned_organization',
    )

    list_filter = (
        'status',
        'subproject_type',
    )


@admin.register(SubProjectDependency)
class SubProjectDependencyAdmin(admin.ModelAdmin):
    list_display = (
        'from_subproject',
        'to_subproject',
        'dependency_type',
    )

    list_filter = (
        'dependency_type',
    )
