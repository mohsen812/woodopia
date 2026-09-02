from rest_framework import serializers
from django.db import models
from .models import (
    Tender,
    TenderRound,
    TenderParticipant,
    Bid,
    BidItem,
    PaymentSchedule,
    TenderAward,
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

class PaymentScheduleSerializer(serializers.ModelSerializer):

    class Meta:
        model = PaymentSchedule

        fields = [
            "id",
            "stage_order",
            "title",
            "percentage",
            "amount",
            "description",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "stage_order",
            "amount",
        ]

    def validate_percentage(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Percentage must be greater than zero."
            )

        return value

    def validate(self, attrs):
        bid = self.context["view"].kwargs.get("bid_id")

        if bid:
            from tenders.models import PaymentSchedule

            total_percentage = (
                PaymentSchedule.objects
                .filter(bid_id=bid)
                .aggregate(
                    total=models.Sum("percentage")
                )["total"]
                or 0
            )

            new_percentage = attrs.get(
                "percentage",
                0
            )

            if total_percentage + new_percentage > 100:
                raise serializers.ValidationError(
                    {
                        "percentage":
                        "Total payment percentage cannot exceed 100%."
                    }
                )

        return attrs

class BidSerializer(serializers.ModelSerializer):

    workshop_name = serializers.CharField(
        source="workshop.name",
        read_only=True,
    )

    items = BidItemSerializer(
        many=True,
        read_only=True,
    )

    payment_schedules = PaymentScheduleSerializer(
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
            "payment_schedules",
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


class TenderRoundCreateSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = TenderRound

        fields = [
            "id",
            "round_number",
            "status",
            "started_at",
            "closed_at",
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
from django.db.models import Sum


def validate_percentage(self, value):
    bid_id = self.context["view"].kwargs.get("bid_id")

    total = PaymentSchedule.objects.filter(
        bid_id=bid_id
    ).aggregate(
        total=Sum("percentage")
    )["total"] or 0

    if total + value > 100:
        raise serializers.ValidationError(
            "Total payment percentage cannot exceed 100."
        )

    return value

class TenderAwardCreateSerializer(
    serializers.Serializer
):

    bid_id = serializers.IntegerField()

class TenderAwardSerializer(
    serializers.ModelSerializer
):

    bid_id = serializers.IntegerField(
        source="bid.id",
        read_only=True,
    )

    workshop_name = serializers.CharField(
        source="bid.workshop.name",
        read_only=True,
    )


    class Meta:

        model = TenderAward

        fields = [
            "id",
            "tender",
            "bid_id",
            "workshop_name",
            "awarded_by",
            "awarded_at",
        ]


        read_only_fields = [
            "id",
            "tender",
            "bid_id",
            "workshop_name",
            "awarded_by",
            "awarded_at",
        ]