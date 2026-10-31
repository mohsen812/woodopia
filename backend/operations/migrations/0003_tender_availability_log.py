from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("operations", "0002_workshop_status_log"),
        ("organizations", "0004_organization_is_tender_available"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TenderAvailabilityLog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("previous_available", models.BooleanField()),
                ("new_available", models.BooleanField()),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="workshop_tender_availability_changes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="tender_availability_logs",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "verbose_name": "Workshop tender availability change",
                "verbose_name_plural": "Workshop tender availability changes",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="tenderavailabilitylog",
            index=models.Index(
                fields=["organization", "-created_at"],
                name="ops_ta_org_created_idx",
            ),
        ),
    ]
