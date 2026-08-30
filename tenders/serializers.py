from rest_framework import serializers

from .models import (
    Tender,
    TenderRound,
    TenderParticipant,
    Bid,
    BidItem,
)


class BidItemSerializer(serializers.ModelSerializer):

    class Meta:

        model = BidItem

        fields = [
            "id",
            "project_item",
            "quantity",
            "unit_price",
            "total_price",
            "availability",
            "technical_notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]



class BidSerializer(serializers.ModelSerializer):

    workshop_name = serializers.CharField(
        source="workshop.name",
        read_only=True,
    )

    items = BidItemSerializer(
        many=True,
        read_only=True,
    )


    class Meta:

        model = Bid

        fields = [
            "id",
            "tender_round",
            "workshop",
            "workshop_name",
            "total_amount",
            "production_days",
            "delivery_days",
            "warranty_months",
            "technical_notes",
            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]



class TenderRoundSerializer(serializers.ModelSerializer):

    bids = BidSerializer(
        many=True,
        read_only=True,
    )


    class Meta:

        model = TenderRound

        fields = [
            "id",
            "round_number",
            "status",
            "started_at",
            "closed_at",
            "created_at",
            "bids",
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
        read_only=True,
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

    rounds = TenderRoundSerializer(
        many=True,
        read_only=True,
    )

    participants = TenderParticipantSerializer(
        many=True,
        read_only=True,
    )


    class Meta:

        model = Tender

        fields = [
            "id",
            "project",
            "title",
            "description",
            "status",
            "deadline",
            "created_at",
            "updated_at",
            "rounds",
            "participants",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "rounds",
            "participants",
        ]