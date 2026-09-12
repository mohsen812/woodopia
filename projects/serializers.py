from rest_framework import serializers

from .models import (
    Project,
    ProjectZone,
    ProjectVisual,
    ProjectItem,
    ProjectAttachment,
)


# =====================================
# PROJECT VISUAL SERIALIZER
# =====================================

class ProjectVisualSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectVisual
        fields = "__all__"


# =====================================
# PROJECT ATTACHMENT SERIALIZER
# =====================================

class ProjectAttachmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectAttachment

        fields = [
            "id",
            "file",
            "file_type",
            "title",
            "description",
            "version",
            "created_at",
            "uploaded_by",
        ]

        read_only_fields = [
            "id",
            "version",
            "created_at",
            "uploaded_by",
        ]


class ProjectAttachmentCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProjectAttachment

        fields = [
            "id",
            "file",
            "file_type",
            "title",
            "description",
            "uploaded_by",
        ]

        read_only_fields = [
            "id",
            "uploaded_by",
        ]


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

    attachments = ProjectAttachmentSerializer(
        many=True,
        read_only=True
    )

    class Meta:

        model = Project

        fields = [
            "id",
            "title",
            "description",
            "estimated_budget",
            "required_delivery_days",
            "location",
            "status",
            "created_at",
            "updated_at",
            "zones",
            "attachments",
        ]


# =====================================
# PROJECT CREATE SERIALIZER
# =====================================

class ProjectCreateSerializer(serializers.ModelSerializer):

    # Internal workspace/visual-engine value.
    # Customer UI does not expose this field.
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
            "estimated_budget",
            "required_delivery_days",
            "capacity_slot",
        ]

        read_only_fields = [
            "id",
        ]

    def create(self, validated_data):

        # capacity_slot belongs to the internal visual engine.
        # It is not part of the Customer Create Project UI.
        capacity_slot = validated_data.pop(
            "capacity_slot",
            1
        )

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication is required to create a project."
            )

        from organizations.models import Membership

        customer_memberships = (
            Membership.objects
            .filter(
                user=request.user,
                status="active",
                organization__organization_type="customer",
                organization__status="active",
            )
            .select_related("organization")
        )

        customer_memberships = list(
            customer_memberships
        )

        if not customer_memberships:
            raise serializers.ValidationError(
                "No active customer workspace is available."
            )

        if len(customer_memberships) > 1:
            raise serializers.ValidationError(
                "Multiple active customer workspaces found. "
                "Please select a workspace before creating a project."
            )

        customer = customer_memberships[0].organization

        # ---------------------------------
        # Create Project
        # ---------------------------------

        project = Project.objects.create(
            customer=customer,
            created_by=request.user,
            status="draft",
            **validated_data
        )

        # ---------------------------------
        # Initial Project Item
        # ---------------------------------

        ProjectItem.objects.create(
            project=project,
            name=project.title,
            description=project.description,
            quantity=1,
        )

        # ---------------------------------
        # Initial Customer Zone
        # ---------------------------------

        zone = ProjectZone.objects.create(
            project=project,
            name="Customer Zone",
            code="CUSTOMER",
            x_position=0,
            y_position=0
        )

        # ---------------------------------
        # Initial Project Visual
        # ---------------------------------

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


# =====================================
# TENDER SELECT WINNER INPUT
# =====================================

class TenderSelectWinnerSerializer(serializers.Serializer):

    bid_id = serializers.IntegerField()
