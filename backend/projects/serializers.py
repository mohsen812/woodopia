from rest_framework import serializers

from .models import (
    Project,
    ProjectZone,
    ProjectVisual,
    ProjectItem,
)


# =====================================
# PROJECT VISUAL SERIALIZER
# =====================================

class ProjectVisualSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectVisual
        fields = "__all__"


# =====================================
# PROJECT ZONE SERIALIZER
# =====================================

class ProjectZoneSerializer(serializers.ModelSerializer):

    visuals = serializers.SerializerMethodField()

    def get_visuals(self, obj):

        visuals = ProjectVisual.objects.filter(
            current_zone=obj
        )

        return ProjectVisualSerializer(
            visuals,
            many=True
        ).data


    class Meta:

        model = ProjectZone

        fields = [
            "id",
            "name",
            "code",
            "description",
            "x_position",
            "y_position",
            "order",
            "is_active",
            "visuals",
        ]


# =====================================
# PROJECT READ SERIALIZER
# =====================================

class ProjectFullSerializer(serializers.ModelSerializer):

    zones = ProjectZoneSerializer(
        many=True,
        read_only=True
    )


    class Meta:

        model = Project

        fields = [
            "id",
            "title",
            "description",
            "status",
            "created_at",
            "updated_at",
            "zones",
        ]


# =====================================
# PROJECT CREATE SERIALIZER
# =====================================

class ProjectCreateSerializer(serializers.ModelSerializer):

    capacity_slot = serializers.IntegerField(
        write_only=True,
        required=False,
        default=1
    )


    class Meta:

        model = Project

        fields = [
            "id",
            "title",
            "description",
            "customer",
            "created_by",
            "status",
            "capacity_slot",
            "created_at",
            "updated_at",
        ]


        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


    def create(self, validated_data):

        capacity_slot = validated_data.pop(
            "capacity_slot",
            1
        )


        # -----------------------------
        # Create Project
        # -----------------------------

        project = Project.objects.create(
            **validated_data
        )


        # -----------------------------
        # Initial Project Item
        # -----------------------------

        ProjectItem.objects.create(
            project=project,
            name=project.title,
            description=project.description,
            quantity=1,
        )


        # -----------------------------
        # Initial Customer Zone
        # -----------------------------

        zone = ProjectZone.objects.create(

            project=project,

            name="Customer Zone",

            code="CUSTOMER",

            x_position=0,

            y_position=0

        )


        # -----------------------------
        # Initial Project Visual
        # -----------------------------

        ProjectVisual.objects.create(

            project=project,

            current_zone=zone,

            name="Initial Project Shape",

            shape_type="triangle",

            color="#8B4513",

            size=100,

            position_x=0,

            position_y=0,

            visual_data={

                "capacity_slot": capacity_slot,

                "engine_version": "phase_2"

            }

        )


        return project