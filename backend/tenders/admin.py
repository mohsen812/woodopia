from django.contrib import admin

from .models import (
    Tender,
    ConsultantSpecification,
    TenderParticipant,
    TenderRound,
    Bid,
    BidItem,
    PaymentSchedule,
)


@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "title",
        "project",
        "status",
        "deadline",
        "created_at",
    ]

    list_filter = [
        "status",
    ]

    search_fields = [
        "title",
        "project__title",
    ]


@admin.register(ConsultantSpecification)
class ConsultantSpecificationAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "tender",
        "project_item",
        "quantity",
        "is_required",
        "created_at",
    ]

    list_filter = [
        "is_required",
    ]

    search_fields = [
        "title",
        "tender__title",
        "project_item__name",
    ]


@admin.register(TenderParticipant)
class TenderParticipantAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "tender",
        "organization",
        "invited_at",
    ]

    search_fields = [
        "tender__title",
        "organization__name",
    ]


@admin.register(TenderRound)
class TenderRoundAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "tender",
        "round_number",
        "status",
        "started_at",
        "closed_at",
    ]

    list_filter = [
        "status",
    ]

    search_fields = [
        "tender__title",
    ]


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "tender_round",
        "workshop",
        "total_amount",
        "production_days",
        "delivery_days",
        "warranty_months",
        "created_at",
    ]

    search_fields = [
        "workshop__name",
        "tender_round__tender__title",
    ]


@admin.register(BidItem)
class BidItemAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "bid",
        "project_item",
        "quantity",
        "unit_price",
        "total_price",
        "availability",
    ]

    list_filter = [
        "availability",
    ]

    search_fields = [
        "project_item__name",
        "bid__workshop__name",
    ]


@admin.register(PaymentSchedule)
class PaymentScheduleAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "bid",
        "stage_order",
        "title",
        "percentage",
        "amount",
    ]

    search_fields = [
        "title",
        "bid__workshop__name",
    ]