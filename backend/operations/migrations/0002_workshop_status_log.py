from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("operations", "0001_initial"),
        ("organizations", "0003_organization_account_code_organization_legal_type"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkshopStatusLog",
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
                ("previous_status", models.CharField(max_length=50)),
                ("new_status", models.CharField(max_length=50)),
                ("reason", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="workshop_status_changes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="operational_status_logs",
                        to="organizations.organization",
                    ),
                ),
            ],
            options={
                "verbose_name": "Workshop status change",
                "verbose_name_plural": "Workshop status changes",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="workshopstatuslog",
            index=models.Index(
                fields=["organization", "-created_at"],
                name="ops_ws_org_created_idx",
            ),
        ),
    ]
