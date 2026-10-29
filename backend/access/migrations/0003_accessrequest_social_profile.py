from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("access", "0002_accessrequest_created_membership_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="accessrequest",
            name="social_network",
            field=models.CharField(
                blank=True,
                choices=[
                    ("instagram", "Instagram"),
                    ("linkedin", "LinkedIn"),
                    ("website", "Website"),
                    ("other", "Other"),
                ],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="accessrequest",
            name="social_profile",
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
