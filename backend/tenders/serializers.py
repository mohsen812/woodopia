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
    ConsultantSpecification,
    SpecificationAttachment,

)

class ConsultantSpecificationSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = ConsultantSpecification

        fields = [
            "id",
            "project_item",
            "row_number",
            "title",
            "dimensions",
            "material",
            "image",
            "description",
            "quantity",
            "technical_details",
            "is_required",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "row_number",
            "created_at",
            "updated_at",
        ]
class SpecificationAttachmentSerializer(
    serializers.ModelSerializer
):

    uploaded_by_name = serializers.CharField(
        source="uploaded_by.username",
        read_only=True,
    )

    class Meta:

        model = SpecificationAttachment

        fields = [
            "id",
            "specification",
            "file",
            "uploaded_by",
            "uploaded_by_name",
            "title",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "specification",
            "uploaded_by",
            "uploaded_by_name",
            "created_at",
        ]

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
            "discount_percentage",
            "discount_amount",
            "final_amount",
            "status",
            "created_at",
            "updated_at",

        ]

        read_only_fields = [
            "id",
            "discount_amount",
            "final_amount",
            "status",            
            "created_at",
            "updated_at",
        ]


class AnonymousBidSerializer(serializers.ModelSerializer):

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

            "production_days",
            "delivery_days",
            "warranty_months",
            "technical_notes",
            "items",
            "payment_schedules",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "tender_round",
            "status",
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
            "response_status",
            "responded_at",
        ]

        read_only_fields = [
            "id",
            "invited_at",
            "responded_at",

        ]

class WorkshopTenderInvitationSerializer(
    serializers.ModelSerializer
):

    tender_title = serializers.CharField(
        source="tender.title",
        read_only=True
    )

    project_title = serializers.CharField(
        source="tender.project.title",
        read_only=True
    )

    bid_id = serializers.SerializerMethodField()

    class Meta:

        model = TenderParticipant

        fields = [
            "id",
            "tender",
            "tender_title",
            "project_title",
            "response_status",
            "invited_at",
            "responded_at",
            "bid_id",
        ]

    def get_bid_id(
        self,
        obj
    ):

        active_round = (
            obj.tender.rounds
            .filter(
                status="open"
            )
            .order_by(
                "round_number"
            )
            .first()
        )

        if not active_round:
            return None

        bid = (
            active_round.bids
            .filter(
                workshop=obj.organization,
                status="draft",
            )
            .first()
        )

        if not bid:
            return None

        return bid.id
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
            "standardization_status",

            "scheduled_start_at",
            "scheduled_end_at",
            "round_count",
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


class TenderAwardCreateSerializer(
    serializers.Serializer
):

    bid_id = serializers.IntegerField()

class TenderSelectBidSerializer(
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
