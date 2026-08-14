from rest_framework import serializers
from .models import Project, ProjectZone, ProjectVisual


class ProjectVisualSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectVisual
        fields = "__all__"


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
