from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        (
            'organizations',
            '0008_assign_default_role_permissions',
        ),
    ]

    operations = [
        migrations.AddField(
            model_name='membership',
            name='role_fk',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='memberships',
                to='organizations.organizationrole',
            ),
        ),
    ]
