from rest_framework import serializers

from .models import (
    Tender,
    TenderParticipant,
    Bid,
)


class BidSerializer(serializers.ModelSerializer):

    workshop_name = serializers.CharField(
        source="workshop.name",
        read_only=True
    )

    class Meta:
        model = Bid

        fields = [
            "id",
            "tender",
            "workshop",
            "workshop_name",
            "amount",
            "technical_notes",
            "production_days",
            "delivery_days",
            "warranty_months",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


class TenderParticipantSerializer(
    serializers.ModelSerializer
):

    organization_name = serializers.CharField(
        source="organization.name",
        read_only=True
    )

    class Meta:
        model = TenderParticipant

        fields = [
            "id",
            "tender",
            "organization",
            "organization_name",
            "invited_at",
        ]

        read_only_fields = [
            "id",
            "invited_at",
        ]


class TenderSerializer(serializers.ModelSerializer):

    bids = BidSerializer(
        many=True,
        read_only=True
    )

    participants = TenderParticipantSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Tender

        fields = [
            "id",
            "project_item",
            "title",
            "description",
            "status",
            "deadline",
            "created_at",
            "participants",
            "bids",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "participants",
            "bids",
        ]