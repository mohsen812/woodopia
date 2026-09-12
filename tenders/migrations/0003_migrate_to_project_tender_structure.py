from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone


def migrate_existing_tender_data(apps, schema_editor):

    Tender = apps.get_model("tenders", "Tender")
    TenderRound = apps.get_model("tenders", "TenderRound")
    Bid = apps.get_model("tenders", "Bid")
    BidItem = apps.get_model("tenders", "BidItem")

    for tender in Tender.objects.all():

        project_item = tender.project_item

        tender.project_id = project_item.project_id
        tender.updated_at = timezone.now()

        tender.save(
            update_fields=[
                "project",
                "updated_at",
            ]
        )

        tender_round = TenderRound.objects.create(
            tender_id=tender.id,
            round_number=1,
            status="open",
            started_at=tender.created_at,
        )

        for bid in Bid.objects.filter(
            tender_id=tender.id
        ):

            old_amount = bid.amount

            bid.tender_round_id = tender_round.id
            bid.total_amount = old_amount
            bid.updated_at = timezone.now()

            bid.save(
                update_fields=[
                    "tender_round",
                    "total_amount",
                    "updated_at",
                ]
            )

            BidItem.objects.create(
                bid_id=bid.id,
                project_item_id=project_item.id,
                quantity=project_item.quantity,
                unit_price=old_amount,
                total_price=old_amount,
                availability="available",
            )



class Migration(migrations.Migration):

    dependencies = [
        (
            "tenders",
            "0002_rename_description_bid_technical_notes_and_more",
        ),
    ]


    operations = [

        # =========================================
        # Tender new fields
        # =========================================

        migrations.AddField(
            model_name="tender",
            name="project",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tenders",
                to="projects.project",
            ),
        ),

        migrations.AddField(
            model_name="tender",
            name="updated_at",
            field=models.DateTimeField(
                null=True,
                blank=True,
            ),
        ),


        # =========================================
        # Tender Round
        # =========================================

        migrations.CreateModel(
            name="TenderRound",
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
                    "round_number",
                    models.PositiveIntegerField(),
                ),

                (
                    "status",
                    models.CharField(
                        max_length=30,
                        default="draft",
                    ),
                ),

                (
                    "started_at",
                    models.DateTimeField(
                        null=True,
                        blank=True,
                    ),
                ),

                (
                    "closed_at",
                    models.DateTimeField(
                        null=True,
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
                    "tender",
                    models.ForeignKey(
                        to="tenders.tender",
                        related_name="rounds",
                        on_delete=django.db.models.deletion.CASCADE,
                    ),
                ),
            ],
        ),


        # =========================================
        # Bid new fields
        # =========================================

        migrations.AddField(
            model_name="bid",
            name="tender_round",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="bids",
                to="tenders.tenderround",
            ),
        ),

        migrations.AddField(
            model_name="bid",
            name="total_amount",
            field=models.DecimalField(
                max_digits=15,
                decimal_places=0,
                null=True,
                blank=True,
            ),
        ),

        migrations.AddField(
            model_name="bid",
            name="updated_at",
            field=models.DateTimeField(
                null=True,
                blank=True,
            ),
        ),


        # =========================================
        # Bid Item
        # =========================================

        migrations.CreateModel(
            name="BidItem",
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
                    "quantity",
                    models.PositiveIntegerField(
                        default=0,
                    ),
                ),

                (
                    "unit_price",
                    models.DecimalField(
                        max_digits=15,
                        decimal_places=0,
                        default=0,
                    ),
                ),

                (
                    "total_price",
                    models.DecimalField(
                        max_digits=15,
                        decimal_places=0,
                        default=0,
                    ),
                ),

                (
                    "availability",
                    models.CharField(
                        max_length=20,
                        default="available",
                    ),
                ),

                (
                    "technical_notes",
                    models.TextField(
                        blank=True,
                    ),
                ),

                (
                    "bid",
                    models.ForeignKey(
                        to="tenders.bid",
                        related_name="items",
                        on_delete=django.db.models.deletion.CASCADE,
                    ),
                ),

                (
                    "project_item",
                    models.ForeignKey(
                        to="projects.projectitem",
                        related_name="bid_items",
                        on_delete=django.db.models.deletion.PROTECT,
                    ),
                ),
            ],
        ),


        # =========================================
        # Data migration
        # =========================================

        migrations.RunPython(
            migrate_existing_tender_data,
            migrations.RunPython.noop,
        ),


        # =========================================
        # Finalize
        # =========================================

        migrations.AlterField(
            model_name="tender",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tenders",
                to="projects.project",
            ),
        ),

        migrations.AlterField(
            model_name="tender",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
            ),
        ),

        migrations.AlterField(
            model_name="bid",
            name="tender_round",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="bids",
                to="tenders.tenderround",
            ),
        ),

        migrations.AlterField(
            model_name="bid",
            name="total_amount",
            field=models.DecimalField(
                max_digits=15,
                decimal_places=0,
                default=0,
            ),
        ),

        migrations.AlterField(
            model_name="bid",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
            ),
        ),


        # =========================================
        # Remove old structure
        # =========================================

        migrations.RemoveField(
            model_name="tender",
            name="project_item",
        ),

        migrations.RemoveField(
            model_name="bid",
            name="tender",
        ),

        migrations.RemoveField(
            model_name="bid",
            name="amount",
        ),
    ]