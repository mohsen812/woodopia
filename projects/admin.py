from django.contrib import admin

from .models import (
    Project,
    ProjectItem,
    SubProjectType,
    SubProject,
    SubProjectDependency,
    ProjectZone,
    ProjectToken,
    ProjectVisual,
    ProjectRoad,
    ProjectMovement,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "customer",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "title",
    )



@admin.register(ProjectItem)
class ProjectItemAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "project",
        "quantity",
        "status",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "name",
    )



@admin.register(SubProjectType)
class SubProjectTypeAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "code",
    )

    search_fields = (
        "name",
        "code",
    )



@admin.register(SubProject)
class SubProjectAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "project_item",
        "subproject_type",
        "status",
        "assigned_organization",
    )

    list_filter = (
        "status",
        "subproject_type",
    )

    search_fields = (
        "name",
    )



@admin.register(SubProjectDependency)
class SubProjectDependencyAdmin(admin.ModelAdmin):

    list_display = (
        "from_subproject",
        "to_subproject",
        "dependency_type",
        "status",
        "is_blocking",
    )

    list_filter = (
        "dependency_type",
        "status",
        "is_blocking",
    )



@admin.register(ProjectZone)
class ProjectZoneAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "code",
        "project",
        "x_position",
        "y_position",
        "is_active",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )

@admin.register(ProjectVisual)
class ProjectVisualAdmin(admin.ModelAdmin):

    list_display = (
        'project',
        'name',
        'shape_type',
        'color',
        'size',
        'is_active',
    )


    list_filter = (
        'shape_type',
        'is_active',
    )


    search_fields = (
        'name',
        'project__title',
    )
    
@admin.register(ProjectToken)
class ProjectTokenAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "project",
        "current_zone",
        "current_subproject",
        "status",
    )

    list_filter = (
        "status",
    )

    search_fields = (
        "title",
    )



@admin.register(ProjectRoad)
class ProjectRoadAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "from_zone",
        "to_zone",
        "direction",
        "speed",
        "is_active",
    )

    list_filter = (
        "is_active",
    )



@admin.register(ProjectMovement)
class ProjectMovementAdmin(admin.ModelAdmin):

    list_display = (
        "token",
        "from_zone",
        "to_zone",
        "action",
        "created_at",
    )

    list_filter = (
        "action",
    )

    search_fields = (
        "token__title",
    )
