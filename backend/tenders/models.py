from django.conf import settings
from django.db import models

from projects.models import Project, ProjectItem
from organizations.models import Organization


class Tender(models.Model):

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("open", "Open"),
        ("closed", "Closed"),
        ("revealed","Revealed"),
        ("awarded", "Awarded"),
        ("cancelled", "Cancelled"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="tenders",
    )

    title = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default="draft",
    )

    deadline = models.DateTimeField(
        null=True,
        blank=True,
    )
    closed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    reveal_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    revealed_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    winner_bid = models.ForeignKey(
        "Bid",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="won_tenders",
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title


class ConsultantSpecification(models.Model):

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="specifications",
    )

    project_item = models.ForeignKey(
        ProjectItem,
        on_delete=models.CASCADE,
        related_name="consultant_specifications",
    )

    title = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    quantity = models.PositiveIntegerField(
        default=1
    )

    technical_details = models.TextField(
        blank=True
    )

    is_required = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "tender",
                    "project_item",
                ],
                name="unique_tender_consultant_specification",
            )
        ]

    def __str__(self):
        return (
            f"{self.tender.title} - "
            f"{self.title}"
        )


class TenderParticipant(models.Model):

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="participants",
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="tender_participations",
    )

    invited_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "tender",
                    "organization",
                ],
                name="unique_tender_participant",
            )
        ]


class TenderRound(models.Model):

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("open", "Open"),
        ("closed", "Closed"),
        ("evaluated", "Evaluated"),
    ]

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="rounds",
    )

    round_number = models.PositiveIntegerField()

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="draft",
    )

    started_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    closed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "tender",
                    "round_number",
                ],
                name="unique_tender_round",
            )
        ]

        ordering = [
            "round_number",
        ]

    def __str__(self):
        return (
            f"{self.tender.title} - "
            f"Round {self.round_number}"
        )


class Bid(models.Model):

    tender_round = models.ForeignKey(
        TenderRound,
        on_delete=models.CASCADE,
        related_name="bids",
    )

    workshop = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="tender_bids",
    )

    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        default=0,
    )

    production_days = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    delivery_days = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    warranty_months = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    technical_notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "tender_round",
                    "workshop",
                ],
                name="unique_workshop_bid_per_round",
            )
        ]

    def __str__(self):
        return (
            f"{self.workshop.name} - "
            f"{self.total_amount}"
        )


class BidItem(models.Model):

    AVAILABILITY_CHOICES = [
        ("available", "Available"),
        ("unavailable", "Unavailable"),
    ]

    bid = models.ForeignKey(
        Bid,
        on_delete=models.CASCADE,
        related_name="items",
    )

    project_item = models.ForeignKey(
        ProjectItem,
        on_delete=models.PROTECT,
        related_name="bid_items",
    )

    quantity = models.PositiveIntegerField(
        default=0
    )

    unit_price = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        default=0,
    )

    total_price = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        default=0,
    )

    availability = models.CharField(
        max_length=20,
        choices=AVAILABILITY_CHOICES,
        default="available",
    )

    technical_notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "bid",
                    "project_item",
                ],
                name="unique_bid_item",
            )
        ]

    def __str__(self):
        return (
            f"{self.bid.workshop.name} - "
            f"{self.project_item.name}"
        )


class PaymentSchedule(models.Model):

    bid = models.ForeignKey(
        Bid,
        on_delete=models.CASCADE,
        related_name="payment_schedules",
    )

    stage_order = models.PositiveIntegerField()

    title = models.CharField(
        max_length=255
    )

    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
    )

    amount = models.DecimalField(
        max_digits=15,
        decimal_places=0,
        default=0,
    )

    description = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "bid",
                    "stage_order",
                ],
                name="unique_payment_stage",
            )
        ]

        ordering = [
            "stage_order",
        ]

    def __str__(self):
        return (
            f"{self.bid.workshop.name} - "
            f"{self.stage_order} - "
            f"{self.percentage}%"
        )

class TenderAward(models.Model):

    tender = models.OneToOneField(
        Tender,
        on_delete=models.CASCADE,
        related_name="award",
    )

    bid = models.ForeignKey(
        Bid,
        on_delete=models.PROTECT,
        related_name="awards",
    )

    awarded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tender_awards",
    )

    awarded_at = models.DateTimeField(
        auto_now_add=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f"{self.tender.title} - "
            f"{self.bid.workshop.name}"
        )
class TenderRoundEvaluation(models.Model):

    tender_round = models.OneToOneField(
        TenderRound,
        on_delete=models.CASCADE,
        related_name="evaluation",
    )

    winner_bid = models.ForeignKey(
        Bid,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="winning_evaluations",
    )

    ranking = models.JSONField(
        default=list
    )

    summary = models.JSONField(
        default=dict
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )


    def __str__(self):
        return (
            f"{self.tender_round.tender.title} "
            f"- Evaluation"
        )