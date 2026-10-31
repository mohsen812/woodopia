from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0003_organization_account_code_organization_legal_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="is_tender_available",
            field=models.BooleanField(default=True),
        ),
    ]
