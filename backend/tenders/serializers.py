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
            "description",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]



class TenderSerializer(serializers.ModelSerializer):

    bids = BidSerializer(
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
            "bids",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "bids",
        ]