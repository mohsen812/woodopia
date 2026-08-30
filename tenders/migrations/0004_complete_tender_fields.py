from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        (
            "tenders",
            "0003_migrate_to_project_tender_structure",
        ),
    ]

    operations = [

        # ==================================================
        # BidItem timestamps
        # ==================================================

        migrations.AddField(
            model_name="biditem",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                null=True,
            ),
        ),

        migrations.AddField(
            model_name="biditem",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                null=True,
            ),
        ),


        # ==================================================
        # Consultant Specification
        # ==================================================

        migrations.CreateModel(
            name="ConsultantSpecification",
            fields=[

                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                    ),
                ),

                (
                    "title",
                    models.CharField(
                        max_length=255,
                    ),
                ),

                (
                    "description",
                    models.TextField(
                        blank=True,
                    ),
                ),

                (
                    "quantity",
                    models.PositiveIntegerField(
                        default=1,
                    ),
                ),

                (
                    "technical_details",
                    models.TextField(
                        blank=True,
                    ),
                ),

                (
                    "is_required",
                    models.BooleanField(
                        default=True,
                    ),
                ),

                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                    ),
                ),

                (
                    "updated_at",
                    models.DateTimeField(
                        auto_now=True,
                    ),
                ),

                (
                    "project_item",
                    models.ForeignKey(
                        to="projects.projectitem",
                        related_name="consultant_specifications",
                        on_delete=django.db.models.deletion.CASCADE,
                    ),
                ),

                (
                    "tender",
                    models.ForeignKey(
                        to="tenders.tender",
                        related_name="specifications",
                        on_delete=django.db.models.deletion.CASCADE,
                    ),
                ),
            ],
        ),


        # ==================================================
        # Payment Schedule
        # ==================================================

        migrations.CreateModel(
            name="PaymentSchedule",
            fields=[

                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                    ),
                ),

                (
                    "stage_order",
                    models.PositiveIntegerField(),
                ),

                (
                    "title",
                    models.CharField(
                        max_length=255,
                    ),
                ),

                (
                    "percentage",
                    models.DecimalField(
                        max_digits=5,
                        decimal_places=2,
                    ),
                ),

                (
                    "amount",
                    models.DecimalField(
                        max_digits=15,
                        decimal_places=0,
                        default=0,
                    ),
                ),

                (
                    "description",
                    models.TextField(
                        blank=True,
                    ),
                ),

                (
                    "created_at",
                    models.DateTimeField(
                        auto_now_add=True,
                    ),
                ),

                (
                    "bid",
                    models.ForeignKey(
                        to="tenders.bid",
                        related_name="payment_schedules",
                        on_delete=django.db.models.deletion.CASCADE,
                    ),
                ),
            ],
        ),


        # ==================================================
        # Constraints
        # ==================================================

        migrations.AddConstraint(
            model_name="tenderround",
            constraint=models.UniqueConstraint(
                fields=[
                    "tender",
                    "round_number",
                ],
                name="unique_tender_round",
            ),
        ),


        migrations.AddConstraint(
            model_name="bid",
            constraint=models.UniqueConstraint(
                fields=[
                    "tender_round",
                    "workshop",
                ],
                name="unique_workshop_bid_per_round",
            ),
        ),


        migrations.AddConstraint(
            model_name="biditem",
            constraint=models.UniqueConstraint(
                fields=[
                    "bid",
                    "project_item",
                ],
                name="unique_bid_item",
            ),
        ),


        migrations.AddConstraint(
            model_name="tenderparticipant",
            constraint=models.UniqueConstraint(
                fields=[
                    "tender",
                    "organization",
                ],
                name="unique_tender_participant",
            ),
        ),


        migrations.AddConstraint(
            model_name="paymentschedule",
            constraint=models.UniqueConstraint(
                fields=[
                    "bid",
                    "stage_order",
                ],
                name="unique_payment_stage",
            ),
        ),


        migrations.AddConstraint(
            model_name="consultantspecification",
            constraint=models.UniqueConstraint(
                fields=[
                    "tender",
                    "project_item",
                ],
                name="unique_tender_consultant_specification",
            ),
        ),
    ]