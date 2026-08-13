from django.contrib import admin

from .models import (
    Project,
    ProjectItem,
    SubProject,
    SubProjectType,
    SubProjectDependency,
    ProjectZone,
    ProjectToken,
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
        'status',
    )


@admin.register(SubProjectType)
class SubProjectTypeAdmin(admin.ModelAdmin):
    list_display = (
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


@admin.register(SubProjectDependency)
class SubProjectDependencyAdmin(admin.ModelAdmin):
    list_display = (
        'from_subproject',
        'to_subproject',
        'dependency_type',
        'status',
        'is_blocking',
    )


@admin.register(ProjectZone)
class ProjectZoneAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'code',
        'order',
    )


@admin.register(ProjectToken)
class ProjectTokenAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'project',
        'current_zone',
        'current_subproject',
        'status',
    )
